import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../database/entities/user.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  id: number;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
