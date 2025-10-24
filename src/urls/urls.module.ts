import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortUrl } from '../database/entities/short-url.entity';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShortUrl])],
  controllers: [UrlsController],
  providers: [UrlsService],
  exports: [UrlsService],
})
export class UrlsModule {}
