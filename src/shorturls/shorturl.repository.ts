import { DataSource, Repository } from 'typeorm';
import { ShortUrl } from '../database/entities/short-url.entity';

export const shortUrlRepositoryFactory = (ds: DataSource) =>
  ds.getRepository(ShortUrl).extend({
    async findByCode(this: Repository<ShortUrl>, code: string) {
      return this.findOne({ where: { code, is_active: true } });
    },
    async findUserUrls(this: Repository<ShortUrl>, userId: number) {
      return this.find({ where: { user: { id: userId }, is_active: true }, order: { created_at: 'DESC' } });
    },
  });
