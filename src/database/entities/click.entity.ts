import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ShortUrl } from './short-url.entity';

@Entity('clicks')
export class Click {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ShortUrl, (short) => short.clicks, { onDelete: 'CASCADE' })
  shortUrl: ShortUrl;

  @Column({ length: 64, nullable: true })
  ip_address: string | null;

  @CreateDateColumn()
  created_at: Date;
}