import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SplitType } from '@prisma/client';

export class ExpenseParticipantDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0)
  amountOwed: number;
}

export class CreateExpenseDto {
  @IsUUID()
  groupId: string;

  @IsUUID()
  payerId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  receiptImage?: string;

  @IsEnum(SplitType)
  splitType: SplitType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseParticipantDto)
  participants: ExpenseParticipantDto[];
}
