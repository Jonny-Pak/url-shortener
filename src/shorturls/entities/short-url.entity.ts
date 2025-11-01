// src/shorturls/entities/short-url.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../database/entities/user.entity';
// import { Click } from './click.entity';

@Entity('short_urls')
@Index(['user', 'created_at']) // hỗ trợ list theo user, mới nhất trước
export class ShortUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'short_code', type: 'varchar', length: 16 })
  short_code: string;

  @Column({ name: 'original_url', type: 'text' })
  original_url: string;

  // user_id (nullable)
  @ManyToOne(() => User, (user) => user.shortUrls, { nullable: true })
  user: User | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

//   @OneToMany(() => Click, (click) => click.shortUrl, { cascade: true })
//   clicks: Click[];
}
