import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateUrlDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.urlsService.create(dto, userId);
  }

  @Get(':code')
  async getOriginal(@Param('code') code: string) {
    const url = await this.urlsService.resolve(code);
    return { originalUrl: url.originalUrl };
  }
}
