import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface WalletBalance {
  address: string;
  balance: string;
  balanceInTon: number;
  lastUpdated: Date;
}

export interface TonApiResponse {
  result: {
    balance: string;
    state: string;
    code: string;
    data: string;
    last_transaction_id: {
      lt: string;
      hash: string;
    };
  };
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly tonApiBaseUrl = 'https://toncenter.com/api/v2';

  constructor(private prisma: PrismaService) {}

  /**
   * Busca o saldo de uma carteira TON pelo endereço
   */
  async getWalletBalance(address: string): Promise<WalletBalance> {
    try {
      this.logger.log(`Buscando saldo da carteira: ${address}`);

      // Fazer requisição para a API da TON
      const response = await axios.get<TonApiResponse>(
        `${this.tonApiBaseUrl}/getAddressBalance`,
        {
          params: { address },
          timeout: 10000, // 10 segundos de timeout
        },
      );

      const balance = response.data.result.balance || '0';
      const balanceInTon = this.convertNanoToTon(balance);

      const walletBalance: WalletBalance = {
        address,
        balance,
        balanceInTon,
        lastUpdated: new Date(),
      };

      this.logger.log(`Saldo encontrado: ${balanceInTon} TON`);
      return walletBalance;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar saldo da carteira ${address}:`,
        error.message,
      );
      throw new Error(`Falha ao buscar saldo da carteira: ${error.message}`);
    }
  }

  /**
   * Busca o saldo da carteira de um usuário pelo ID
   */
  async getUserWalletBalance(userId: string): Promise<WalletBalance> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tonWalletAddress: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (!user.tonWalletAddress) {
        throw new Error('Usuário não possui endereço de carteira configurado');
      }

      return await this.getWalletBalance(user.tonWalletAddress);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar saldo do usuário ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Busca o saldo da carteira de um usuário pelo Telegram ID
   */
  async getUserWalletBalanceByTelegramId(
    telegramId: bigint,
  ): Promise<WalletBalance> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          tonWalletAddress: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (!user.tonWalletAddress) {
        throw new Error('Usuário não possui endereço de carteira configurado');
      }

      return await this.getWalletBalance(user.tonWalletAddress);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar saldo do usuário Telegram ${telegramId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Busca saldos de múltiplas carteiras
   */
  async getMultipleWalletBalances(
    addresses: string[],
  ): Promise<WalletBalance[]> {
    try {
      this.logger.log(`Buscando saldos de ${addresses.length} carteiras`);

      const balancePromises = addresses.map(async address => {
        try {
          return await this.getWalletBalance(address);
        } catch (error) {
          this.logger.warn(
            `Falha ao buscar saldo da carteira ${address}: ${error.message}`,
          );
          return {
            address,
            balance: '0',
            balanceInTon: 0,
            lastUpdated: new Date(),
            error: error.message,
          } as WalletBalance & { error?: string };
        }
      });

      const balances = await Promise.all(balancePromises);
      this.logger.log(
        `Saldos buscados com sucesso para ${balances.length} carteiras`,
      );

      return balances;
    } catch (error) {
      this.logger.error('Erro ao buscar múltiplos saldos:', error.message);
      throw new Error(`Falha ao buscar múltiplos saldos: ${error.message}`);
    }
  }

  /**
   * Busca saldos de todos os usuários do sistema
   */
  async getAllUsersWalletBalances(): Promise<
    (WalletBalance & { userId: string; userName: string })[]
  > {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          tonWalletAddress: true,
          firstName: true,
          lastName: true,
        },
        where: {
          tonWalletAddress: {
            not: '',
          },
        },
      });

      const balances = await Promise.all(
        users.map(async user => {
          try {
            const balance = await this.getWalletBalance(user.tonWalletAddress);
            return {
              ...balance,
              userId: user.id,
              userName: `${user.firstName} ${user.lastName || ''}`.trim(),
            };
          } catch (error) {
            this.logger.warn(
              `Falha ao buscar saldo do usuário ${user.id}: ${error.message}`,
            );
            return {
              address: user.tonWalletAddress,
              balance: '0',
              balanceInTon: 0,
              lastUpdated: new Date(),
              userId: user.id,
              userName: `${user.firstName} ${user.lastName || ''}`.trim(),
              error: error.message,
            } as WalletBalance & {
              userId: string;
              userName: string;
              error?: string;
            };
          }
        }),
      );

      return balances;
    } catch (error) {
      this.logger.error(
        'Erro ao buscar saldos de todos os usuários:',
        error.message,
      );
      throw new Error(
        `Falha ao buscar saldos de todos os usuários: ${error.message}`,
      );
    }
  }

  /**
   * Converte nano TON para TON
   */
  private convertNanoToTon(nanoAmount: string): number {
    if (!nanoAmount || nanoAmount === 'undefined' || nanoAmount === 'null') {
      return 0;
    }

    try {
      const nano = BigInt(nanoAmount);
      const ton = Number(nano) / 1e9; // 1 TON = 10^9 nano TON
      return Math.round(ton * 1000000) / 1000000; // Arredonda para 6 casas decimais
    } catch (error) {
      this.logger.warn(
        `Erro ao converter nano amount '${nanoAmount}': ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Verifica se a API da TON está funcionando
   */
  async checkApiHealth(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Teste simples com um endereço conhecido (TON Foundation)
      const testAddress = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

      await axios.get(`${this.tonApiBaseUrl}/getAddressBalance`, {
        params: { address: testAddress },
        timeout: 5000,
      });

      return {
        status: 'TON API is working',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('TON API health check failed:', error.message);
      throw new Error(`TON API is not responding: ${error.message}`);
    }
  }
}
