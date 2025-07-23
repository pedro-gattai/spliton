// backend/src/payments/payments.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserDebt {
  to: string;
  toName: string;
  toAddress: string;
  amount: number;
  expenseId: string;
  expenseDescription: string;
  participantId: string;
}

export interface CalculateDebtsResponse {
  success: boolean;
  debts: UserDebt[];
  totalAmount: number;
  debtsCount: number;
  error?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcular TODAS as dívidas de um usuário
   */
  async calculateUserDebts(
    userId: string,
    groupId?: string,
  ): Promise<CalculateDebtsResponse> {
    try {
      this.logger.log(
        `💰 Calculando dívidas do usuário ${userId}${groupId ? ` no grupo ${groupId}` : ''}`,
      );

      // Buscar TODAS as participações não pagas do usuário
      const unpaidParticipations =
        await this.prisma.expenseParticipant.findMany({
          where: {
            userId,
            isSettled: false,
            amountOwed: { gt: 0 },
            ...(groupId && {
              expense: {
                groupId,
              },
            }),
          },
          include: {
            expense: {
              include: {
                payer: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                    tonWalletAddress: true,
                  },
                },
                group: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

      this.logger.log(
        `📊 Encontradas ${unpaidParticipations.length} dívidas não pagas`,
      );

      // Converter para formato de dívidas
      const debts: UserDebt[] = unpaidParticipations.map(participation => ({
        to: participation.expense.payer.id,
        toName: `@${participation.expense.payer.username}`,
        toAddress: participation.expense.payer.tonWalletAddress,
        amount: participation.amountOwed,
        expenseId: participation.expense.id,
        expenseDescription: participation.expense.description || 'Despesa',
        participantId: participation.id,
      }));

      // Filtrar apenas quem tem endereço TON
      const validDebts = debts.filter(
        debt => debt.toAddress && debt.toAddress.length > 0,
      );

      if (validDebts.length < debts.length) {
        this.logger.warn(
          `⚠️ ${debts.length - validDebts.length} dívidas foram filtradas por falta de endereço TON`,
        );
      }

      const totalAmount = validDebts.reduce(
        (sum, debt) => sum + debt.amount,
        0,
      );

      this.logger.log(
        `✅ ${validDebts.length} dívidas válidas, total: ${totalAmount} TON`,
      );

      return {
        success: true,
        debts: validDebts,
        totalAmount,
        debtsCount: validDebts.length,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao calcular dívidas:', error.message);
      return {
        success: false,
        debts: [],
        totalAmount: 0,
        debtsCount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Marcar uma dívida como paga
   */
  async markDebtAsPaid(participantId: string) {
    try {
      await this.prisma.expenseParticipant.update({
        where: { id: participantId },
        data: {
          isSettled: true,
          settledAt: new Date(),
        },
      });

      this.logger.log(`✅ Dívida ${participantId} marcada como paga`);
      return { success: true };
    } catch (error) {
      this.logger.error('❌ Erro ao marcar dívida como paga:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marcar múltiplas dívidas como pagas
   */
  async markMultipleDebtsAsPaid(participantIds: string[]) {
    try {
      await this.prisma.expenseParticipant.updateMany({
        where: {
          id: { in: participantIds },
        },
        data: {
          isSettled: true,
          settledAt: new Date(),
        },
      });

      this.logger.log(
        `✅ ${participantIds.length} dívidas marcadas como pagas`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error('❌ Erro ao marcar dívidas como pagas:', error.message);
      return { success: false, error: error.message };
    }
  }
}
