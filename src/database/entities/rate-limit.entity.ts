import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rate_limits')
export class RateLimit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ipAddress: string;

  @Column()
  actionType: string;

  @Column({ default: 0 })
  count: number;

  @Column()
  resetAt: Date;
}
