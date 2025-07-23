import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

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
   * Executa o pagamento de uma dívida via smart contract (TON)
   */
  async payDebtViaSmartContract(
    toAddress: string,
    amount: number,
    groupId?: string,
    description?: string,
  ) {
    try {
      this.logger.log(`🚀 Iniciando pagamento via contrato SplitPayment`);
      this.logger.log(`📍 Para: ${toAddress}, Valor: ${amount} TON`);

      // 1. Configurar cliente TON
      const client = new TonClient({
        endpoint:
          process.env.TON_API_ENDPOINT ||
          'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY,
      });

      // 2. Configurar carteira do backend
      const mnemonic = process.env.TON_BACKEND_MNEMONIC;
      if (!mnemonic) {
        throw new Error('TON_BACKEND_MNEMONIC não configurado');
      }

      const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
      const workchain = 0;
      const wallet = WalletContractV4.create({
        workchain,
        publicKey: keyPair.publicKey,
      });
      const contract = client.open(wallet);

      // 3. Preparar mensagem para o contrato SplitPayment
      const contractAddress = process.env.SPLIT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('SPLIT_CONTRACT_ADDRESS não configurado');
      }

      const amountNano = BigInt(Math.floor(amount * 1e9));
      const contractFee = (amountNano * BigInt(2)) / BigInt(100); // 2% fee
      const gasAmount = BigInt(100_000_000); // 0.1 TON gas
      const totalAmount = amountNano + contractFee + gasAmount;

      // 4. Criar payload para DirectPayment
      const payload = this.createDirectPaymentPayload(
        toAddress,
        amount,
        groupId,
        description,
      );

      // 5. Enviar transação
      const seqno = await contract.getSeqno();

      await contract.sendTransfer({
        secretKey: keyPair.secretKey,
        seqno: seqno,
        messages: [
          internal({
            to: contractAddress,
            value: totalAmount,
            body: payload,
            bounce: false,
          }),
        ],
      });

      // 6. Aguardar confirmação (simplificado)
      let currentSeqno = seqno;
      while (currentSeqno == seqno) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        currentSeqno = await contract.getSeqno();
      }

      this.logger.log(
        `✅ Pagamento enviado com sucesso! Seqno: ${currentSeqno}`,
      );

      return {
        success: true,
        message: 'Pagamento processado via contrato SplitPayment',
        seqno: currentSeqno,
        amount: amount,
        recipient: toAddress,
      };
    } catch (error) {
      this.logger.error(
        '❌ Erro ao executar pagamento via contrato:',
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private createDirectPaymentPayload(
    toAddress: string,
    amount: number,
    groupId?: string,
    description?: string,
  ) {
    // Implementar serialização para o contrato Tact
    // Formato específico que seu contrato SplitPayment espera
    const opcode = 0x01; // DirectPayment opcode (defina conforme seu contrato)

    // Simplified payload - ajuste conforme sua implementação Tact
    const payloadString = `DirectPayment:${toAddress}:${amount}:${groupId || ''}:${description || ''}`;
    return payloadString;
  }

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
