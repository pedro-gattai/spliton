import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

export interface CreateGroupDto {
  name: string;
  description?: string;
  createdBy: string;
  userIds: string[];
}

export interface GroupWithMembers {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
    joinedAt: Date;
    isActive: boolean;
    user: {
      id: string;
      username: string;
      email: string | null;
      tonWalletAddress: string;
    };
  }>;
  creator: {
    id: string;
    username: string;
    email: string | null;
  };
}

export interface GroupBalance {
  balance: number;
  totalPaid: number;
  totalOwed: number;
  status: 'owe' | 'receive' | 'settled';
}

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Cria um novo grupo e adiciona membros diretamente
   */
  async createGroup(createGroupDto: CreateGroupDto): Promise<GroupWithMembers> {
    const { name, description, createdBy, userIds } = createGroupDto;

    // Verificar se o criador existe
    const creator = await this.prisma.user.findUnique({
      where: { id: createdBy },
    });

    if (!creator) {
      throw new NotFoundException('Usuário criador não encontrado');
    }

    // Verificar se todos os usuários existem
    const uniqueUserIds = [...new Set(userIds)];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
    });

    if (users.length !== uniqueUserIds.length) {
      throw new BadRequestException('Um ou mais usuários não encontrados');
    }

    // Gerar código de convite único
    const inviteCode = this.generateInviteCode();

    // Criar o grupo
    const group = await this.prisma.group.create({
      data: {
        name,
        description,
        createdBy,
        inviteCode,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                tonWalletAddress: true,
              },
            },
          },
        },
      },
    });

    // Adicionar o criador como admin
    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: createdBy,
        role: 'ADMIN',
      },
    });

    // Adicionar membros diretamente
    for (const userId of uniqueUserIds) {
      if (userId === createdBy) continue; // Pular o criador

      await this.addUserToGroup(group.id, userId);
    }

    // Buscar o grupo com todos os membros
    return this.getGroupById(group.id);
  }

  /**
   * Adiciona usuário a um grupo
   */
  private async addUserToGroup(groupId: string, userId: string): Promise<void> {
    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!existingMember) {
      await this.prisma.groupMember.create({
        data: {
          groupId,
          userId,
          role: 'MEMBER',
        },
      });
    }
  }

  /**
   * Busca grupo por ID
   */
  async getGroupById(groupId: string): Promise<GroupWithMembers> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                tonWalletAddress: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    return group as any;
  }

  /**
   * Busca grupos de um usuário
   */
  async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    const groups = await this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
            isActive: true,
          },
        },
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                tonWalletAddress: true,
              },
            },
          },
        },
      },
    });

    return groups as any;
  }

  /**
   * Gera código de convite único
   */
  private generateInviteCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  /**
   * Calcula o balanço de um usuário em um grupo específico
   */
  async getGroupBalance(
    groupId: string,
    userId: string,
  ): Promise<GroupBalance> {
    try {
      this.logger.log(
        `Calculando balanço do usuário ${userId} no grupo ${groupId}`,
      );

      // Verificar se o grupo existe
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new NotFoundException('Grupo não encontrado');
      }

      // Verificar se o usuário é membro do grupo
      const member = await this.prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!member) {
        throw new NotFoundException('Usuário não é membro deste grupo');
      }

      // Total que o usuário pagou no grupo (despesas que ele criou)
      const totalPaidResult = await this.prisma.expense.aggregate({
        where: {
          groupId,
          payerId: userId,
        },
        _sum: { amount: true },
      });
      const totalPaid = Number(totalPaidResult._sum.amount || 0);

      // Total que o usuário deve no grupo (participações em despesas não liquidadas)
      const totalOwedResult = await this.prisma.expenseParticipant.aggregate({
        where: {
          userId,
          isSettled: false,
          expense: {
            groupId,
          },
        },
        _sum: { amountOwed: true },
      });
      const totalOwed = Number(totalOwedResult._sum?.amountOwed || 0);

      // Calcular o balanço (positivo = deve receber, negativo = deve pagar)
      const balance = totalPaid - totalOwed;

      // Determinar o status
      let status: 'owe' | 'receive' | 'settled';
      if (Math.abs(balance) < 0.01) {
        status = 'settled';
      } else if (balance > 0) {
        status = 'receive';
      } else {
        status = 'owe';
      }

      return {
        balance,
        totalPaid,
        totalOwed,
        status,
      };
    } catch (error) {
      this.logger.error(`Erro ao calcular balanço do grupo: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Falha ao calcular balanço: ${error.message}`);
    }
  }
}
