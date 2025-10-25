import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity'

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,  
  ) {}

  async findAll(): Promise<User[]> {
    return this.repo.find();
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async update(updatedUser: User): Promise<User | null> {
    await this.repo.save(updatedUser);
    return updatedUser;
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected > 0;
  }

  async search(query: string): Promise<User[]> {
    return this.repo
      .createQueryBuilder('user')
      .where('LOWER(user.email) LIKE LOWER(:q)', { q: `%${query}%` })
      .getMany();
  }

  async query(sql: string): Promise<any> {
    return this.repo.query(sql);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }
}
