import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return this.appService.testDatabaseConnection();
  }

  @Get('stats')
  async getStats() {
    return this.appService.getDatabaseStats();
  }
}
