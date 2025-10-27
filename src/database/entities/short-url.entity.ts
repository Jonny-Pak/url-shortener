import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Click } from './click.entity';

@Entity('short_urls')
export class ShortUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 16 })
  code: string;

  @Column({ type: 'text' })
  original_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @ManyToOne(() => User, (user) => user.shortUrls, { nullable: true })
  user: User | null;

  @OneToMany(() => Click, (click) => click.shortUrl, { cascade: true })
  clicks: Click[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}


