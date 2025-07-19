import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WalletService, WalletBalance } from './wallet.service';

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  /**
   * GET /wallet/balance/:address
   * Busca o saldo de uma carteira pelo endereço
   */
  @Get('balance/:address')
  async getWalletBalance(
    @Param('address') address: string,
  ): Promise<WalletBalance> {
    try {
      this.logger.log(`Requisição para buscar saldo da carteira: ${address}`);
      return await this.walletService.getWalletBalance(address);
    } catch (error) {
      this.logger.error(`Erro na rota getWalletBalance: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /wallet/user/:userId
   * Busca o saldo da carteira de um usuário pelo ID
   */
  @Get('user/:userId')
  async getUserWalletBalance(
    @Param('userId') userId: string,
  ): Promise<WalletBalance> {
    try {
      this.logger.log(`Requisição para buscar saldo do usuário: ${userId}`);
      return await this.walletService.getUserWalletBalance(userId);
    } catch (error) {
      this.logger.error(`Erro na rota getUserWalletBalance: ${error.message}`);

      if (error.message.includes('não encontrado')) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /wallet/telegram/:telegramId
   * Busca o saldo da carteira de um usuário pelo Telegram ID
   */
  @Get('telegram/:telegramId')
  async getUserWalletBalanceByTelegramId(
    @Param('telegramId') telegramId: string,
  ): Promise<WalletBalance> {
    try {
      this.logger.log(
        `Requisição para buscar saldo do usuário Telegram: ${telegramId}`,
      );

      // Converter string para BigInt
      const telegramIdBigInt = BigInt(telegramId);
      return await this.walletService.getUserWalletBalanceByTelegramId(
        telegramIdBigInt,
      );
    } catch (error) {
      this.logger.error(
        `Erro na rota getUserWalletBalanceByTelegramId: ${error.message}`,
      );

      if (error.message.includes('não encontrado')) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /wallet/multiple
   * Busca saldos de múltiplas carteiras
   * Query params: addresses (array de endereços separados por vírgula)
   */
  @Get('multiple')
  async getMultipleWalletBalances(
    @Query('addresses') addressesParam: string,
  ): Promise<WalletBalance[]> {
    try {
      if (!addressesParam) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Parâmetro "addresses" é obrigatório',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const addresses = addressesParam.split(',').map((addr) => addr.trim());

      if (addresses.length === 0) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Pelo menos um endereço deve ser fornecido',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Requisição para buscar saldos de ${addresses.length} carteiras`,
      );
      return await this.walletService.getMultipleWalletBalances(addresses);
    } catch (error) {
      this.logger.error(
        `Erro na rota getMultipleWalletBalances: ${error.message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /wallet/all
   * Busca saldos de todas as carteiras de usuários do sistema
   */
  @Get('all')
  async getAllUsersWalletBalances(): Promise<
    (WalletBalance & { userId: string; userName: string })[]
  > {
    try {
      this.logger.log('Requisição para buscar saldos de todos os usuários');
      return await this.walletService.getAllUsersWalletBalances();
    } catch (error) {
      this.logger.error(
        `Erro na rota getAllUsersWalletBalances: ${error.message}`,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /wallet/health
   * Verifica se a API da TON está funcionando
   */
  @Get('health')
  async checkApiHealth(): Promise<{ status: string; timestamp: Date }> {
    try {
      this.logger.log('Requisição para verificar saúde da API TON');
      return await this.walletService.checkApiHealth();
    } catch (error) {
      this.logger.error(`Erro na rota checkApiHealth: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  
}
