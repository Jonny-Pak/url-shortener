// src/auth/dto/register.dto
import { IsEmail, IsNotEmpty, MinLength, Matches, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum Role {
  User = 'user',
  Admin = 'admin',
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
  })
  password: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true, message: 'Role phải là user hoặc admin' })
  role?: Role[];
}
