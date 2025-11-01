import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import { ShortUrlsService } from './shorturl.service';
import { CreateShortUrlDto } from './dto/create-shorturl.dto';

@Controller('shortlinks')
export class ShortUrlsController {
  constructor(private readonly shortUrlsService: ShortUrlsService) {}

  @Post('create')
  async create(@Body() body: CreateShortUrlDto, @Req() req: any) {
    let userId: number | undefined = undefined;
    if (req && req.user && typeof req.user.userId === 'number') {
      userId = req.user.userId;
    }

    if (!body.original_url || typeof body.original_url !== 'string') {
      throw new BadRequestException('original_url không hợp lệ.');
    }

    const result = await this.shortUrlsService.createShortUrl(body, userId);
    if (!result.success || !result.data) {
      throw new BadRequestException(result.error || 'Tạo shortlink thất bại.');
    }

    return {
      message: 'Tạo shortlink thành công!',
      id: result.data.id,
      code: result.data.code,
      shortlink: result.data.shortlink,
    };
  }
}
