// src/auth/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../database/entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
