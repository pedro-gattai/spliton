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
      firstName: string;
      lastName: string | null;
      email: string | null;
      tonWalletAddress: string;
    };
  }>;
  creator: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
  };
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

    return group;
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                tonWalletAddress: true,
              },
            },
          },
        },
      },
    });

    return groups;
  }

  /**
   * Gera código de convite único
   */
  private generateInviteCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }
}
