// src/users/users.service.ts
import { User, UserResponse, Role } from '../database/entities/user.entity';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { UserRepository } from '../users/users.repository';
import { UserValidator } from '../users/validators';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createUser(input: CreateUserDto): Promise<{ success: boolean; user?: UserResponse; error?: string }> {
    if (!UserValidator.isValidEmail(input.email)) {
      return { success: false, error: 'Email không đúng định dạng.' };
    }
    const existingUser = await this.repository.findByEmail(input.email);
    if (existingUser) {
      return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const now = new Date();
    const user = new User();
    user.email = input.email;
    user.password = hashedPassword;
    user.role = input.role ?? Role.User; // enum đơn, không phải mảng
    user.createdAt = now;
    user.updatedAt = now;

    const savedUser = await this.repository.save(user);
    const { password, ...userResponse } = savedUser;
    return { success: true, user: userResponse };
  }

  async getAllUser(): Promise<UserResponse[]> {
    const users = await this.repository.findAll();
    return users.map(({ password, ...rest }) => rest);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.repository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async updateUser(input: UpdateUserDto): Promise<{ success: boolean; student?: UserResponse; error?: string }> {
    const find_user = await this.repository.findById(input.id);
    if (!find_user) {
      return { success: false, error: 'Không tìm thấy người dùng.' };
    }

    const update: User = { ...find_user, updatedAt: new Date() };

    if (input.email) {
      if (!UserValidator.isValidEmail(input.email)) {
        return { success: false, error: 'Email không đúng định dạng.' };
      }
      if (input.email !== find_user.email) {
        const existingEmail = await this.repository.findByEmail(input.email);
        if (existingEmail && existingEmail.id !== input.id) {
          return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
        }
      }
      update.email = input.email.trim();
    }

    if (input.password) {
      update.password = await bcrypt.hash(input.password, 10);
    }

    // enum đơn: gán trực tiếp nếu có
    if (input.role) {
      update.role = input.role;
    }

    const savedUser = await this.repository.update(update);
    if (!savedUser) {
      return { success: false, error: 'Cập nhật thất bại.' };
    }
    const { password, ...studentResponse } = savedUser;
    return { success: true, student: studentResponse };
  }

  async deleteUser(id: number): Promise<{ success: boolean; error?: string }> {
    const ok = await this.repository.deleteById(id);
    return ok ? { success: true } : { success: false, error: 'Lỗi không thể xóa người dùng này' };
  }

  async searchUser(query: string): Promise<UserResponse[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const users = await this.repository.search(query.toLowerCase());
    return users.map(({ password, ...rest }) => rest);
  }

  async testConnection() {
    try {
      await this.repository.query('SELECT 1');
      return 'Kết nối DB thành công!';
    } catch (error) {
      return `Lỗi: ${error.message}`;
    }
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
