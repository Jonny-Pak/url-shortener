import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,  // Private như mẫu, gọi qua methods public
  ) {}

  // Tìm tất cả users (options cho role/limit, exclude password)
  async findAll(options?: { role?: UserRole; limit?: number }): Promise<User[]> {
    const query = this.repo.createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.role', 'user.createdAt', 'user.updatedAt'])  // Exclude password
      .orderBy('user.createdAt', 'DESC');

    if (options?.role) {
      query.andWhere('user.role = :role', { role: options.role });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    return query.getMany();
  }

  // Tìm user theo ID (include relations nếu cần)
  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['shortUrls'],  // Optional load related
      select: ['id', 'email', 'role', 'password', 'createdAt', 'updatedAt'],  // Include password cho update/auth
    });
  }

  // Tìm user theo email (case-insensitive)
  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'role', 'createdAt', 'updatedAt'],
    });
  }

  // Tạo và save user mới
  async create(data: Partial<User>): Promise<User> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  // Update user (partial, save và return updated)
  async update(updatedUser: Partial<User> & { id: number }): Promise<User | null> {
    await this.repo.update(updatedUser.id, updatedUser);
    return this.findById(updatedUser.id);
  }

  // Xóa user theo ID, return true nếu affected >0
  async deleteById(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected > 0;
  }

  // Tìm kiếm users theo query (email hoặc role, ILIKE case-insensitive)
  async search(query: string): Promise<User[]> {
    const searchQuery = query.toLowerCase();
    return this.repo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.role', 'user.createdAt', 'user.updatedAt'])
      .where('LOWER(user.email) LIKE LOWER(:query) OR LOWER(user.role) LIKE LOWER(:query)', { query: `%${searchQuery}%` })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  // Raw query nếu cần (e.g., complex joins)
  async query(sql: string, parameters?: any): Promise<any> {
    return this.repo.query(sql, parameters);
  }

  // Helper: Check email exists (exclude id cho update)
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user && (!excludeId || user.id !== excludeId);
  }
}
