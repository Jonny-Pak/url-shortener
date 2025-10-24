import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsArray, IsString, IsEnum } from 'class-validator';  // Thêm cho validation nếu cần

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // id required cho update
  id: number;

  // role optional: string[] (inherit từ CreateUserDto, nhưng explicit để rõ ràng và thêm validation nếu cần)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(['user', 'admin'], { each: true })  // Optional: Giới hạn roles hợp lệ (thêm nếu muốn enforce)
  role?: string[];

  // Không explicit email/password để inherit từ PartialType(CreateUserDto):
  // - email?: string với @IsEmail() optional
  // - password?: string với @IsString() optional
  // Nếu cần custom (e.g., password min length cho update), thêm explicit dưới
  /*
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)  // Ví dụ: Password ít nhất 6 ký tự khi update
  password?: string;
  */
}
