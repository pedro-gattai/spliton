import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, WalletModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
