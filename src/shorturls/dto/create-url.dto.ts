import { IsUrl, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'URL không được để trống' })
  @IsUrl({}, { message: 'URL không hợp lệ' })
  originalUrl: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày hết hạn không hợp lệ' })
  expiresAt?: string;
}
