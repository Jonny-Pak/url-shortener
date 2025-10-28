// src/shorturls/tasks/shorturls-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortUrl } from '../../database/entities/short-url.entity';

@Injectable()
export class ShortUrlsCron {
  private readonly logger = new Logger(ShortUrlsCron.name);
  constructor(@InjectRepository(ShortUrl) private readonly repo: Repository<ShortUrl>) {}

  @Cron('0 0 * * *') // 00:00 hàng ngày
  async expireUrls() {
    const now = new Date();
    const q = this.repo
      .createQueryBuilder()
      .update(ShortUrl)
      .set({ is_active: false })
      .where('is_active = :active', { active: true })
      .andWhere('expires_at IS NOT NULL')
      .andWhere('expires_at < :now', { now });
    const result = await q.execute();
    this.logger.log(`Expired ${result.affected ?? 0} URLs`);
  }
}
