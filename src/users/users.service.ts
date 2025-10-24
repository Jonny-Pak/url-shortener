import { User, UserResponse } from '../database/entities/user.entity';  // Import User và StudentResponse
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { UserRepository } from '../users/users.repository';
import { UserValidator } from '../users/validators';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Service class containing business logic for user operations
 */
@Injectable()
export class UserService {
  private repository: UserRepository;

  constructor(repository: UserRepository) {
    this.repository = repository;
  }

  /**
   * Creates a new user with validation
   */
  async createUser(input: CreateUserDto): Promise<{ success: boolean; user?: UserResponse; error?: string }> {
    // Validate input data
    if (!UserValidator.isValidEmail(input.email)) {
      return { success: false, error: 'Email không đúng định dạng.' };
    }

    // Check for duplicate email using repository for efficiency
    const existingUser = await this.repository.findByEmail(input.email);
    if (existingUser) {
      return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create new user manually
    const now = new Date();
    const user = new User();
    user.email = input.email;
    user.password = hashedPassword;
    user.role = input.role && input.role.length > 0 ? input.role : ['user'];  // Handle roles array
    user.createdAt = now;
    user.updatedAt = now;

    const savedUser = await this.repository.save(user);
    // Omit password for response
    const { password, ...studentResponse } = savedUser;
    return { success: true, user: studentResponse };
  }

  /**
   * Retrieves all users
   */
  async getAllUser(): Promise<UserResponse[]> {
    const users = await this.repository.findAll();
    // Map to omit password for security
    return users.map(user => {
      const { password, ...response } = user;
      return response;
    });
  }

  /**
   * Finds a user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    return await this.repository.findById(id);  // Use repository method for efficiency
  }

  /**
   * Finds a user by email (for auth/login)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.repository.findByEmail(email);
  }

  /**
   * Updates an existing user
   */
  async updateUser(input: UpdateUserDto): Promise<{ success: boolean; student?: UserResponse; error?: string }> {
    const find_user = await this.repository.findById(input.id);
    if (!find_user) {
      return { success: false, error: 'Không tìm thấy người dùng.' };
    }

    // Prepare update object
    const update: User = {
      ...find_user,
      updatedAt: new Date()
    };

    // Handle email update with validation
    if (input.email) {
      if (!UserValidator.isValidEmail(input.email)) {
        return { success: false, error: 'Email không đúng định dạng.' };
      }
      // Only check duplicate if email is changing and exclude current user
      if (input.email !== find_user.email) {
        const existingEmail = await this.repository.findByEmail(input.email);
        if (existingEmail && existingEmail.id !== input.id) {
          return { success: false, error: 'Email đã tồn tại trong hệ thống.' };
        }
      }
      update.email = input.email.trim();
    }

    // Handle password update with hashing
    if (input.password) {
      update.password = await bcrypt.hash(input.password, 10);
    }

    // Handle roles update from array DTO
    if (input.role && input.role.length > 0) {
      update.role = input.role;
    }

    const savedUser = await this.repository.update(update);
    if (!savedUser) {
      return { success: false, error: 'Cập nhật thất bại.' };
    }
    // Omit password for response
    const { password, ...studentResponse } = savedUser;
    return { success: true, student: studentResponse };
  }

  /**
   * Deletes a user by ID
   */
  async deleteUser(id: number): Promise<{ success: boolean; error?: string }> {
    const delete_user = await this.repository.deleteById(id);
    if (delete_user) {
      return { success: true };
    } else {
      return { success: false, error: "Lỗi không thể xóa người dùng này" };
    }
  }

  /**
   * Searches users by query string
   */
  async searchUser(query: string): Promise<UserResponse[]> {
    if (!query || query.trim().length === 0) {
      return [];  // Return empty array instead of throwing error here
    }
    const users = await this.repository.search(query.toLowerCase());
    // Map to omit password
    return users.map(user => {
      const { password, ...response } = user;
      return response;
    });
  }

  async testConnection() {
    try {
      await this.repository.query('SELECT 1');  // Test DB connection
      return 'Kết nối DB thành công!';
    } catch (error) {
      return `Lỗi: ${error.message}`;
    }
  }

  // Optional: Add method for password comparison if needed for auth
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
