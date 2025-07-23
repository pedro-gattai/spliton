import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(1, { message: 'Endereço da carteira é obrigatório' })
  tonWalletAddress: string;

  @IsString()
  @MinLength(3, { message: 'Username deve ter pelo menos 3 caracteres' })
  @MaxLength(20, { message: 'Username muito longo' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Username deve conter apenas letras e números, sem espaços',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;
} 