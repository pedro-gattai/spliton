import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async getExpenses(@Query('groupId') groupId?: string) {
    if (groupId) {
      return await this.expensesService.getExpensesByGroup(groupId);
    }
    return await this.expensesService.getExpenses();
  }

  @Get(':id')
  async getExpenseById(@Param('id') id: string) {
    return await this.expensesService.getExpenseById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return await this.expensesService.createExpense(createExpenseDto);
  }

  @Put(':id')
  async updateExpense(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return await this.expensesService.updateExpense(id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExpense(@Param('id') id: string) {
    return await this.expensesService.deleteExpense(id);
  }
}
