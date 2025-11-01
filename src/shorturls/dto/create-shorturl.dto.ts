import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateShortUrlDto {
  @IsString()
  @IsUrl()
  original_url: string;

  @IsOptional()
  @IsString()
  expires_at?: string | null;
}
