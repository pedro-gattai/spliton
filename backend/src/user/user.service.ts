import {
  Injectable,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

export interface UserResponse {
  id: string;
  tonWalletAddress: string;
  username: string;
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
        return this.mapUserToResponse(existingUser as any);
      }

      // Verificar se username já existe (se fornecido)
      if (createUserDto.username) {
        const existingUsername = await this.prisma.user.findFirst({
          where: { username: createUserDto.username.toLowerCase() },
        });

        if (existingUsername) {
          throw new ConflictException(
            `Username '${createUserDto.username}' já está em uso`,
          );
        }
      }

      // Verificar se email já existe (se fornecido)
      if (createUserDto.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: { email: createUserDto.email.toLowerCase() },
        });

        if (existingEmail) {
          throw new ConflictException(
            `Email '${createUserDto.email}' já está em uso`,
          );
        }
      }

      // Gerar um telegramId único (usando timestamp + random)
      const telegramId =
        BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));

      const user = await this.prisma.user.create({
        data: {
          telegramId,
          tonWalletAddress: createUserDto.tonWalletAddress,
          username: createUserDto.username.toLowerCase(),
          email: createUserDto.email?.toLowerCase(),
        },
      });

      this.logger.log(`Usuário criado com sucesso: ${user.id}`);

      return this.mapUserToResponse(user);
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
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

      return user ? this.mapUserToResponse(user as any) : null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário por endereço: ${error.message}`,
      );
      throw new Error(`Falha ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Busca um usuário pelo username
   */
  async findByUsername(username: string): Promise<UserResponse | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { username: username.toLowerCase() },
      });

      return user ? this.mapUserToResponse(user as any) : null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário por username: ${error.message}`,
      );
      throw new Error(`Falha ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Busca um usuário por username, email ou endereço da carteira
   */
  async searchUser(identifier: string): Promise<UserResponse | null> {
    try {
      this.logger.log(`🔍 Buscando usuário por identificador: "${identifier}"`);

      const cleanIdentifier = identifier.trim();
      if (!cleanIdentifier) return null;

      let user: any = null;

      // BUSCAR por username primeiro (case insensitive):
      if (cleanIdentifier.startsWith('@')) {
        const usernameQuery = cleanIdentifier.substring(1).toLowerCase();
        this.logger.log(`🔍 Buscando por username: "${usernameQuery}"`);

        user = await this.prisma.user.findFirst({
          where: {
            username: {
              equals: usernameQuery,
              mode: 'insensitive',
            },
          },
        });
      } else {
        // Tentar username sem @:
        this.logger.log(`🔍 Tentando username sem @: "${cleanIdentifier}"`);

        user = await this.prisma.user.findFirst({
          where: {
            username: {
              equals: cleanIdentifier.toLowerCase(),
              mode: 'insensitive',
            },
          },
        });

        // Se não encontrou, tentar por email:
        if (!user && cleanIdentifier.includes('@')) {
          this.logger.log(`🔍 Tentando por email: "${cleanIdentifier}"`);

          user = await this.prisma.user.findFirst({
            where: {
              email: {
                equals: cleanIdentifier.toLowerCase(),
                mode: 'insensitive',
              },
            },
          });
        }

        // Se não encontrou, tentar por carteira:
        if (
          !user &&
          (cleanIdentifier.startsWith('EQ') ||
            cleanIdentifier.startsWith('UQ') ||
            cleanIdentifier.length > 30)
        ) {
          this.logger.log(
            `🔍 Tentando por endereço de carteira: "${cleanIdentifier}"`,
          );

          user = await this.prisma.user.findFirst({
            where: {
              tonWalletAddress: {
                equals: cleanIdentifier,
                mode: 'insensitive',
              },
            },
          });
        }

        // Se não encontrou, tentar busca por nome (primeiro nome ou sobrenome):
        if (!user && cleanIdentifier.length >= 3) {
          this.logger.log(`🔍 Tentando busca por nome: "${cleanIdentifier}"`);

          user = await this.prisma.user.findFirst({
            where: {
              OR: [
                {
                  firstName: {
                    contains: cleanIdentifier,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: cleanIdentifier,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          });
        }
      }

      if (!user) {
        this.logger.log(
          `❌ Nenhum usuário encontrado para: "${cleanIdentifier}"`,
        );
        return null;
      }

      this.logger.log(
        `✅ Usuário encontrado: ${user.username} (${user.username || user.email || user.tonWalletAddress})`,
      );
      return this.mapUserToResponse(user as any);
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar usuário: ${error.message}`);
      throw new Error(`Falha ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Busca múltiplos usuários por termo de busca
   */
  async searchUsers(
    query: string,
    limit: number = 10,
  ): Promise<UserResponse[]> {
    try {
      this.logger.log(`🔍 Buscando múltiplos usuários por: "${query}"`);

      const cleanQuery = query.trim();
      if (!cleanQuery || cleanQuery.length < 2) {
        return [];
      }

      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            {
              username: {
                contains: cleanQuery,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: cleanQuery,
                mode: 'insensitive',
              },
            },
            {
              firstName: {
                contains: cleanQuery,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: cleanQuery,
                mode: 'insensitive',
              },
            },
            {
              tonWalletAddress: {
                contains: cleanQuery,
                mode: 'insensitive',
              },
            },
          ],
        },
        take: limit,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      });

      this.logger.log(`✅ Encontrados ${users.length} usuários`);
      return users.map(user => this.mapUserToResponse(user as any));
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar usuários: ${error.message}`);
      throw new Error(`Falha ao buscar usuários: ${error.message}`);
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

      return user ? this.mapUserToResponse(user as any) : null;
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

      return this.mapUserToResponse(user as any);
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
    username: string;
    email?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponse {
    return {
      id: user.id,
      tonWalletAddress: user.tonWalletAddress,
      username: user.username,
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
