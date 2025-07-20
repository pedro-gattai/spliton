import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // Verificar conexão com banco
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        service: 'spliton-backend',
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error?.message || 'Unknown error',
        service: 'spliton-backend',
      };
    }
  }

  @Get('db')
  async checkDatabase() {
    try {
      // Verificar se migrations estão aplicadas (tipagem correta)
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        migrations: 'applied',
        tables: Number(result[0].count),
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        migrations: 'pending',
        error: error?.message || 'Unknown error',
      };
    }
  }
}
