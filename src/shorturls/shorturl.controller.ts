import { Controller, Post, Get, Delete, Param, Body, Req, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortUrl } from '../database/entities/short-url.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('api/shortlinks')
export class ShortUrlsController {
  constructor(
    @InjectRepository(ShortUrl) private readonly repo: Repository<ShortUrl>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // POST /api/shortlinks — public + authenticated
  @Post()
  async create(@Body() body: { original_url: string; expires_at?: string | null }, @Req() req: any) {
    // Inline: optional auth
    let userId: number | null = null;
    const auth = req.headers?.authorization as string | undefined;
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const payload = this.jwt.verify(auth.slice(7), { secret: this.config.get<string>('JWT_SECRET')! });
        userId = payload?.sub ?? null;
      } catch {
        userId = null; 
      }
    }

    // Inline: generate unique code
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (;;) {
      code = Array.from({ length: 7 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      const exists = await this.repo.exist({ where: { code } });
      if (!exists) break;
    }


    const expires = body.expires_at ? new Date(body.expires_at) : null;


    const entity = this.repo.create({
      code,
      original_url: body.original_url,
      is_active: true,
      expires_at: expires,
      user: userId ? ({ id: userId } as any) : null,
    });
    const saved = await this.repo.save(entity);
    return { id: saved.id, code: saved.code, shortlink: `/${saved.code}` };
  }

  // GET /api/shortlinks — authenticated only
  @Get()
  async listMine(@Req() req: any) {
    const auth = req.headers?.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const payload = this.jwt.verify(auth.slice(7), { secret: this.config.get<string>('JWT_SECRET')! });
    const userId = payload?.sub;
    if (!userId) throw new UnauthorizedException('Invalid token');

    return this.repo.find({ where: { user: { id: userId }, is_active: true }, order: { created_at: 'DESC' } });
  }

  // GET /api/shortlinks/:id — authenticated only
  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: any) {
    const auth = req.headers?.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const payload = this.jwt.verify(auth.slice(7), { secret: this.config.get<string>('JWT_SECRET')! });
    const userId = payload?.sub;
    if (!userId) throw new UnauthorizedException('Invalid token');

    const short = await this.repo.findOne({ where: { id: Number(id), is_active: true }, relations: ['user'] });
    if (!short) throw new NotFoundException('Không tìm thấy short link');
    if (!short.user || short.user.id !== userId) throw new ForbiddenException('Không có quyền truy cập');
    return short;
  }

  // DELETE /api/shortlinks/:id — authenticated only (soft delete)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const auth = req.headers?.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const payload = this.jwt.verify(auth.slice(7), { secret: this.config.get<string>('JWT_SECRET')! });
    const userId = payload?.sub;
    if (!userId) throw new UnauthorizedException('Invalid token');

    const short = await this.repo.findOne({ where: { id: Number(id) }, relations: ['user'] });
    if (!short) throw new NotFoundException('Không tìm thấy short link');
    if (!short.user || short.user.id !== userId) throw new ForbiddenException('Không có quyền xoá');

    short.is_active = false; 
    await this.repo.save(short);
    return { success: true };
  }
}
