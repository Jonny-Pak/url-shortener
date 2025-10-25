import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ShortUrl } from '../database/entities/short-url.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class UrlsService {
  constructor(@InjectRepository(ShortUrl) private readonly shortRepo: Repository<ShortUrl>) {}

  async create(dto: CreateUrlDto, userId?: number) {
    let sanitized = dto.originalUrl;
    try {
      const u = new URL(dto.originalUrl);
      const params = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','ref','source'];
      for (const p of params) u.searchParams.delete(p);
      sanitized = u.toString();
    } catch {
      sanitized = dto.originalUrl;
    }


    let code = '';
    let attempts = 0;
    while (attempts < 5) {
      code = randomBytes(4).toString('hex').slice(0, 7);
      const exists = await this.shortRepo.findOne({ where: { shortCode: code } });
      if (!exists) break;
      attempts++;
    }
    if (attempts >= 5) throw new BadRequestException('Không thể tạo short code duy nhất, thử lại');

    const entity = this.shortRepo.create({
      shortCode: code,
      originalUrl: sanitized,
      userId: userId ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: true,
    });
    return this.shortRepo.save(entity);
  }

  async resolve(code: string) {
    const now = new Date();
    const url = await this.shortRepo.findOne({
      where: [
        { shortCode: code, isActive: true, expiresAt: null },
        { shortCode: code, isActive: true, expiresAt: MoreThan(now) },
      ],
    });
    if (!url) throw new NotFoundException('Short URL không tồn tại hoặc đã hết hạn');
    return url;
  }
}
