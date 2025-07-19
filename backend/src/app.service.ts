import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async testDatabaseConnection(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Testa a conexão executando uma query simples
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'Database connection successful',
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  async getDatabaseStats(): Promise<{
    users: number;
    groups: number;
    expenses: number;
  }> {
    const [users, groups, expenses] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.group.count(),
      this.prisma.expense.count(),
    ]);

    return { users, groups, expenses };
  }
}
