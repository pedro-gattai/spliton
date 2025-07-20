import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserDto {
  tonWalletAddress: string;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
}

export interface UserResponse {
  id: string;
  tonWalletAddress: string;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalExpenses: number;
  totalSpent: number;
  totalOwed: number;
  totalToReceive: number;
  groupsCount: number;
  settledExpenses: number;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo usuário
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserResponse> {
    try {
      this.logger.log(
        `Criando usuário com endereço: ${createUserDto.tonWalletAddress}`,
      );

      // Verificar se já existe um usuário com este endereço
      const existingUser = await this.prisma.user.findFirst({
        where: { tonWalletAddress: createUserDto.tonWalletAddress },
      });

      if (existingUser) {
        this.logger.log(
          `Usuário já existe com endereço: ${createUserDto.tonWalletAddress}`,
        );
        return this.mapUserToResponse(existingUser);
      }

      // Gerar um telegramId único (usando timestamp + random)
      const telegramId =
        BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));

      const user = await this.prisma.user.create({
        data: {
          telegramId,
          tonWalletAddress: createUserDto.tonWalletAddress,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          username: createUserDto.username,
          email: createUserDto.email,
        },
      });

      this.logger.log(`Usuário criado com sucesso: ${user.id}`);

      return this.mapUserToResponse(user);
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`);
      throw new Error(`Falha ao criar usuário: ${error.message}`);
    }
  }

  /**
   * Busca um usuário pelo endereço da carteira
   */
  async findByWalletAddress(
    walletAddress: string,
  ): Promise<UserResponse | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { tonWalletAddress: walletAddress },
      });

      return user ? this.mapUserToResponse(user) : null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário por endereço: ${error.message}`,
      );
      throw new Error(`Falha ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Busca um usuário pelo ID
   */
  async findById(id: string): Promise<UserResponse | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user ? this.mapUserToResponse(user) : null;
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário por ID: ${error.message}`);
      throw new Error(`Falha ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Atualiza um usuário
   */
  async updateUser(
    id: string,
    updateData: Partial<CreateUserDto>,
  ): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return this.mapUserToResponse(user);
    } catch (error) {
      this.logger.error(`Erro ao atualizar usuário: ${error.message}`);
      throw new Error(`Falha ao atualizar usuário: ${error.message}`);
    }
  }

  /**
   * Mapeia o modelo do Prisma para a resposta da API
   */
  private mapUserToResponse(user: {
    id: string;
    tonWalletAddress: string;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponse {
    return {
      id: user.id,
      tonWalletAddress: user.tonWalletAddress,
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      username: user.username ?? undefined,
      email: user.email ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Calcula estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      this.logger.log(`Calculando estatísticas do usuário: ${userId}`);

      // Verificar se o usuário existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Total de despesas criadas pelo usuário
      const totalExpenses = await this.prisma.expense.count({
        where: { payerId: userId },
      });

      // Total gasto pelo usuário (despesas que ele pagou)
      const totalSpentResult = await this.prisma.expense.aggregate({
        where: { payerId: userId },
        _sum: { amount: true },
      });
      const totalSpent = Number(totalSpentResult._sum.amount || 0);

      // Total que o usuário deve (participações em despesas não liquidadas)
      const totalOwedResult = await this.prisma.expenseParticipant.aggregate({
        where: {
          userId,
          isSettled: false,
        },
        _sum: { amountOwed: true },
      });
      const totalOwed = Number(totalOwedResult._sum?.amountOwed || 0);

      // Total que o usuário deve receber (outros devem a ele)
      const totalToReceiveResult =
        await this.prisma.expenseParticipant.aggregate({
          where: {
            expense: {
              payerId: userId,
            },
            userId: { not: userId },
            isSettled: false,
          },
          _sum: { amountOwed: true },
        });
      const totalToReceive = Number(totalToReceiveResult._sum?.amountOwed || 0);

      // Número de grupos que o usuário é membro
      const groupsCount = await this.prisma.groupMember.count({
        where: { userId },
      });

      // Número de despesas liquidadas
      const settledExpenses = await this.prisma.expenseParticipant.count({
        where: {
          userId,
          isSettled: true,
        },
      });

      return {
        totalExpenses,
        totalSpent,
        totalOwed,
        totalToReceive,
        groupsCount,
        settledExpenses,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao calcular estatísticas do usuário: ${error.message}`,
      );
      throw new Error(`Falha ao calcular estatísticas: ${error.message}`);
    }
  }
}
