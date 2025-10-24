import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';  // Đảm bảo path đúng (e.g., ../database/entities/user.entity nếu cần)
import { Click } from './click.entity';

@Entity('short_urls')
@Index(['shortCode'])  // Tối ưu query cho shortCode unique
export class ShortUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  shortCode: string;

  @Column()
  originalUrl: string;

  @Column({ nullable: true, name: 'user_id' })
  userId: number;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;

  // ManyToOne relation - Giờ sẽ work vì User có shortUrls
  @ManyToOne(() => User, (user) => user.shortUrls, { nullable: true, onDelete: 'SET NULL' })  // Set NULL nếu user xóa
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Click, (click) => click.shortUrl, { cascade: true })
  clicks: Click[];
}
