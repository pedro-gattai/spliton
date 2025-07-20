import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { ExpensesModule } from './expenses/expenses.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, 
    WalletModule, 
    UserModule, 
    GroupModule, 
    EmailModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
