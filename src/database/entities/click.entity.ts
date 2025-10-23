import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ShortUrl } from './short-url.entity';

@Entity('clicks')
export class Click {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shortUrlId: number;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  country: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ShortUrl, (shortUrl) => shortUrl.clicks)
  @JoinColumn({ name: 'short_url_id' })
  shortUrl: ShortUrl;
}
