import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * GET /payments/debts/:userId
   * Calcular todas as dívidas de um usuário
   */
  @Get('debts/:userId')
  async getUserDebts(
    @Param('userId') userId: string,
    @Query('groupId') groupId?: string,
  ) {
    try {
      this.logger.log(`📊 Buscando dívidas do usuário ${userId}`);

      const result = await this.paymentsService.calculateUserDebts(
        userId,
        groupId,
      );

      this.logger.log(`✅ Retornando ${result.debtsCount} dívidas`);

      return result;
    } catch (error) {
      this.logger.error('❌ Erro no endpoint getUserDebts:', error);
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
   * POST /payments/mark-paid
   * Marcar dívidas como pagas após pagamento no frontend
   */
  @Post('mark-paid')
  async markAsPaid(@Body() body: { participantIds: string[] }) {
    try {
      this.logger.log(
        `💸 Marcando ${body.participantIds.length} dívidas como pagas`,
      );

      const result = await this.paymentsService.markMultipleDebtsAsPaid(
        body.participantIds,
      );

      return result;
    } catch (error) {
      this.logger.error('❌ Erro no endpoint markAsPaid:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
