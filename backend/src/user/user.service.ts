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
}
