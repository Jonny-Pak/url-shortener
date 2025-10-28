// src/redirect/redirect.controller.ts
import { Controller, Get, Param, Res, Req, NotFoundException } from '@nestjs/common';
import { Response, Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortUrl } from '../database/entities/short-url.entity';
import { Click } from '../database/entities/click.entity';

@Controller()
export class RedirectController {
  constructor(
    @InjectRepository(ShortUrl) private readonly shortRepo: Repository<ShortUrl>,
    @InjectRepository(Click) private readonly clickRepo: Repository<Click>,
  ) {}

  @Get(':code')
  async handle(@Param('code') code: string, @Res() res: Response, @Req() req: Request) {
    const short = await this.shortRepo.findOne({ where: { code, is_active: true } });
    const now = new Date();
    if (!short || (short.expires_at && short.expires_at < now)) {
      throw new NotFoundException('Short link không tồn tại hoặc đã hết hạn');
    }

    // Inline IP extraction
    const xff = req.headers['x-forwarded-for'] as string | undefined;
    const ip = xff ? xff.split(',').shift()!.trim() : (req.ip || (req.socket as any)?.remoteAddress || null);

    // Async tracking (fire-and-forget)
    this.clickRepo.insert({ shortUrl: { id: short.id } as any, ip_address: ip }).catch(() => {});

    // Inline redirect 302 (Found); nếu cần 301: statusCode = 301
    res.status(302).set('Location', short.original_url).end();
  }
}
