// src/shorturls/shorturls.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortUrl } from './entities/short-url.entity';
import { CreateShortUrlDto } from './dto/create-shorturl.dto';

@Injectable()
export class ShortUrlsService {
  constructor(@InjectRepository(ShortUrl) private readonly repo: Repository<ShortUrl>) {}

  async createShortUrl(input: CreateShortUrlDto, userId?: number): Promise<{ success: boolean; data?: { id: number; code: string; shortlink: string }; error?: string }> {
    // 1) Sinh code 7 ký tự, kiểm tra trùng bằng vòng lặp + findOne
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    while (true) {
      code = '';
      for (let i = 0; i < 7; i++) {
        const r = Math.floor(Math.random() * chars.length);
        code += chars[r];
      }
      const existed = await this.repo.findOne({ where: { short_code: code } as any });
      if (!existed) {
        break;
      }
    }

    // 2) Xử lý expires_at (nếu có) bằng if/else
    let expires: Date | null = null;
    if (input.expires_at && typeof input.expires_at === 'string') {
      const d = new Date(input.expires_at);
      if (!isNaN(d.getTime())) {
        expires = d;
      } else {
        return { success: false, error: 'expires_at không hợp lệ' };
      }
    }

    // 3) Tạo entity và gán user nếu có
    const entity = new ShortUrl();
    entity.short_code = code;
    entity.original_url = input.original_url;
    entity.is_active = true;
    entity.expires_at = expires;
    if (userId && typeof userId === 'number') {
      // chỉ map khoá ngoại theo id để TypeORM hiểu
      (entity as any).user = { id: userId };
    } else {
      (entity as any).user = null;
    }

    // 4) Lưu và trả kết quả
    const saved = await this.repo.save(entity);
    return {
      success: true,
      data: { id: saved.id, code: saved.short_code, shortlink: `/${saved.short_code}` },
    };
  }
}
