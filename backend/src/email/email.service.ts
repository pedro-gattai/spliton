import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || 'test-key';
    this.resend = new Resend(apiKey);
  }

  /**
   * Envia convite para um grupo
   */
  async sendGroupInvite(
    email: string,
    groupName: string,
    inviteToken: string,
    inviterName: string,
  ): Promise<boolean> {
    try {
      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/invite/${inviteToken}`;
      
      this.logger.log(`[EMAIL] Tentando enviar convite para ${email} - Grupo: ${groupName}`);
      this.logger.log(`[EMAIL] URL do convite: ${inviteUrl}`);

      // Modo de teste - apenas logar
      this.logger.log(`[TESTE] Email de convite seria enviado para ${email}:`);
      this.logger.log(`[TESTE] Assunto: Convite para o grupo ${groupName} no SplitOn`);
      this.logger.log(`[TESTE] Link: ${inviteUrl}`);
      
      // Se tivermos uma API key válida, tentar enviar
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'test-key') {
        const { data, error } = await this.resend.emails.send({
          from: 'noreply@gabrielmartins0377.me',
          to: [email],
          subject: `Convite para o grupo ${groupName} no SplitOn`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0088cc;">Convite para o grupo ${groupName}</h2>
              <p>Olá!</p>
              <p>Você foi convidado por <strong>${inviterName}</strong> para participar do grupo <strong>${groupName}</strong> no SplitOn.</p>
              <p>SplitOn é uma plataforma para dividir despesas usando a blockchain TON.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="background-color: #0088cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Aceitar Convite
                </a>
              </div>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
              <p>Este convite expira em 7 dias.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Se você não esperava este convite, pode ignorar este email.
              </p>
            </div>
          `,
        });

        if (error) {
          this.logger.error(`Erro ao enviar email para ${email}:`, error);
          return false;
        }

        this.logger.log(`Email de convite enviado para ${email} com sucesso`);
        return true;
      } else {
        this.logger.log(`[TESTE] Email simulado - API key não configurada`);
        return true; // Retorna true para simular sucesso
      }
    } catch (error) {
      this.logger.error(
        `Erro ao enviar email de convite para ${email}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Envia email de boas-vindas para novos usuários
   */
  async sendWelcomeEmail(
    email: string,
    userName: string,
    groupName: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'noreply@gabrielmartins0377.me',
        to: [email],
        subject: `Bem-vindo ao grupo ${groupName} no SplitOn!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0088cc;">Bem-vindo ao SplitOn!</h2>
            <p>Olá <strong>${userName}</strong>!</p>
            <p>Parabéns! Você foi adicionado com sucesso ao grupo <strong>${groupName}</strong> no SplitOn.</p>
            <p>Agora você pode:</p>
            <ul>
              <li>Criar e gerenciar despesas</li>
              <li>Dividir custos com outros membros</li>
              <li>Acompanhar saldos e pagamentos</li>
              <li>Fazer transferências via blockchain TON</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background-color: #0088cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Acessar SplitOn
              </a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Divirta-se dividindo despesas de forma segura e transparente!
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Erro ao enviar email de boas-vindas para ${email}:`, error);
        return false;
      }

      this.logger.log(`Email de boas-vindas enviado para ${email} com sucesso`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email de boas-vindas para ${email}:`, error);
      return false;
    }
  }
} 