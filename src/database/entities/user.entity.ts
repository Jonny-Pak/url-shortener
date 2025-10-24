import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,  // Thêm để tự động update updatedAt
  OneToMany,  // Thêm cho relation với ShortUrl
} from 'typeorm';
import { ShortUrl } from './short-url.entity';  // Import ShortUrl (đảm bảo path đúng, e.g., cùng folder entities)

// Định nghĩa table name rõ ràng
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })  // Thêm unique để tránh duplicate emails
  email: string;

  @Column({ nullable: false })  // Password bắt buộc
  password: string;

@Column({ type: 'text', array: true, nullable: false, default: () => "ARRAY['user']::text[]" })
role: string[];


  @CreateDateColumn({ type: 'timestamp' })  // Tự động set createdAt
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })  // Tự động update updatedAt khi save/update
  updatedAt: Date;

  // Thêm OneToMany relation với ShortUrl (fix lỗi TS2339 trong ShortUrl entity)
  @OneToMany(() => ShortUrl, (shortUrl) => shortUrl.user, { cascade: true, nullable: true })
  shortUrls: ShortUrl[];  // Property này cho phép query user.shortUrls
}

// Loại bỏ password khi trả kết quả API (giữ nguyên, nhưng giờ compatible với shortUrls)
export type UserResponse = Omit<User, 'password'>;
