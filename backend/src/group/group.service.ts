import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

export interface CreateGroupDto {
  name: string;
  description?: string;
  createdBy: string;
  memberEmails: string[];
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

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Cria um novo grupo e envia convites
   */
  async createGroup(createGroupDto: CreateGroupDto): Promise<GroupWithMembers> {
    const { name, description, createdBy, memberEmails } = createGroupDto;

    // Verificar se o criador existe
    const creator = await this.prisma.user.findUnique({
      where: { id: createdBy },
    });

    if (!creator) {
      throw new NotFoundException('Usuário criador não encontrado');
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

    // Processar emails dos membros
    const uniqueEmails = [...new Set(memberEmails)];
    
    for (const email of uniqueEmails) {
      if (email === creator.email) continue; // Pular o criador

      await this.processMemberInvite(group.id, email, creator.firstName);
    }

    // Buscar o grupo com todos os membros
    return this.getGroupById(group.id);
  }

  /**
   * Processa convite para um email
   */
  private async processMemberInvite(
    groupId: string,
    email: string,
    inviterName: string,
  ): Promise<void> {
    try {
      // Verificar se já existe um convite pendente
      const existingInvite = await this.prisma.groupInvite.findFirst({
        where: {
          groupId,
          email,
          status: 'PENDING',
        },
      });

      if (existingInvite) {
        this.logger.log(`Convite já existe para ${email} no grupo ${groupId}`);
        return;
      }

      // Verificar se o usuário já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Usuário já existe, adicionar ao grupo
        await this.addUserToGroup(groupId, existingUser.id);
        
        // Enviar email de boas-vindas
        await this.emailService.sendWelcomeEmail(
          email,
          existingUser.firstName,
          (await this.prisma.group.findUnique({ where: { id: groupId } }))?.name || 'Grupo',
        );
      } else {
        // Usuário não existe, criar convite
        const token = this.generateInviteToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

        await this.prisma.groupInvite.create({
          data: {
            groupId,
            email,
            token,
            expiresAt,
          },
        });

        // Enviar email de convite
        const group = await this.prisma.group.findUnique({
          where: { id: groupId },
        });

        if (group) {
          await this.emailService.sendGroupInvite(
            email,
            group.name,
            token,
            inviterName,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao processar convite para ${email}:`, error);
    }
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
   * Aceita convite por token
   */
  async acceptInvite(token: string, userId: string): Promise<GroupWithMembers> {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { token },
      include: { group: true },
    });

    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Convite já foi usado ou expirou');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Convite expirou');
    }

    // Verificar se o usuário tem o email correto
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== invite.email) {
      throw new BadRequestException('Email não corresponde ao convite');
    }

    // Adicionar usuário ao grupo
    await this.addUserToGroup(invite.groupId, userId);

    // Marcar convite como aceito
    await this.prisma.groupInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Enviar email de boas-vindas
    await this.emailService.sendWelcomeEmail(
      user.email!,
      user.firstName,
      invite.group.name,
    );

    return this.getGroupById(invite.groupId);
  }

  /**
   * Verifica se convite é válido
   */
  async validateInvite(token: string): Promise<{
    isValid: boolean;
    groupName?: string;
    email?: string;
    message?: string;
  }> {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { token },
      include: { group: true },
    });

    if (!invite) {
      return { isValid: false, message: 'Convite não encontrado' };
    }

    if (invite.status !== 'PENDING') {
      return { isValid: false, message: 'Convite já foi usado' };
    }

    if (invite.expiresAt < new Date()) {
      return { isValid: false, message: 'Convite expirou' };
    }

    return {
      isValid: true,
      groupName: invite.group.name,
      email: invite.email,
    };
  }

  /**
   * Gera código de convite único
   */
  private generateInviteCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  /**
   * Gera token de convite único
   */
  private generateInviteToken(): string {
    return randomBytes(32).toString('hex');
  }
} 