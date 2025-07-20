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

export class UpdateExpenseParticipantDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0)
  amountOwed: number;
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  receiptImage?: string;

  @IsEnum(SplitType)
  @IsOptional()
  splitType?: SplitType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExpenseParticipantDto)
  @IsOptional()
  participants?: UpdateExpenseParticipantDto[];
}
