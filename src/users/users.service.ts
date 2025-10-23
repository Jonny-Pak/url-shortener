import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  Logger, 
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserResponse } from '../database/entities/user.entity';  
import * as bcrypt from 'bcrypt';

const logger = new Logger('UsersService');  

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Check email tồn tại 
  private async checkEmailExists(email: string, excludeId?: number): Promise<void> {
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    if (existingUser && (!excludeId || existingUser.id !== excludeId)) {
      throw new ConflictException('Email đã được sử dụng');
    }
  }

  // Tìm user bằng email 
  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ 
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'role', 'createdAt', 'updatedAt'] 
    });
  }

  // Tạo user mới 
  async create(createDto: { email: string; password: string; role?: UserRole }): Promise<UserResponse> {
    try {
      const { email, password, role = UserRole.USER } = createDto;
      

      if (!email || !password) {
        throw new BadRequestException('Email và password là bắt buộc');
      }
      if (password.length < 6) {
        throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
      }
      if (role !== UserRole.USER && role !== UserRole.ADMIN) {
        throw new BadRequestException('Role phải là "user" hoặc "admin"');
      }

      await this.checkEmailExists(email);

      const hashedPassword = await bcrypt.hash(password, 10);


      const savedUser = await this.usersRepository.save({
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
      });
      
      logger.log(`User created: ${email} (ID: ${savedUser.id}, role: ${savedUser.role})`);
      
      return this.sanitizeUser(savedUser);  
    } catch (error) {
      logger.error(`Create user failed for ${createDto.email}: ${error.message}`);
      throw error;
    }
  }

  // Lấy tất cả users 
  async findAll(options?: { role?: UserRole; limit?: number }): Promise<UserResponse[]> {
    try {
      const query = this.usersRepository.createQueryBuilder('user')
        .select(['user.id', 'user.email', 'user.role', 'user.createdAt', 'user.updatedAt']) 
        .orderBy('user.createdAt', 'DESC');

      if (options?.role) {
        query.andWhere('user.role = :role', { role: options.role });
      }

      if (options?.limit) {
        query.limit(options.limit);
      }

      const users = await query.getMany();
      logger.log(`Fetched ${users.length} users` + (options?.role ? ` with role ${options.role}` : ''));
      
      return users.map(user => this.sanitizeUser(user));  
    } catch (error) {
      logger.error(`Find all users failed: ${error.message}`);
      throw error;
    }
  }

  // Tìm kiếm users
  async search(query: string): Promise<UserResponse[]> {
    try {
      if (!query?.trim()) {
        throw new BadRequestException('Query không được để trống');
      }
      const searchQuery = query.toLowerCase();
      const users = await this.usersRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.email', 'user.role', 'user.createdAt', 'user.updatedAt'])
        .where('LOWER(user.email) LIKE :query OR LOWER(user.role) LIKE :query', { query: `%${searchQuery}%` })
        .orderBy('user.createdAt', 'DESC')
        .getMany();
      logger.log(`Search users for "${query}": ${users.length} results`);
      return users.map(user => this.sanitizeUser(user));  
    } catch (error) {
      logger.error(`Search users failed: ${error.message}`);
      throw error;
    }
  }

  // Lấy 1 user theo ID (return UserResponse)
  async findOne(id: number): Promise<UserResponse> {
    try {
      const user = await this.usersRepository.findOne({ 
        where: { id },
        relations: ['shortUrls'],  // Optional
        select: ['id', 'email', 'role', 'createdAt', 'updatedAt']  
      });

      if (!user) {
        throw new NotFoundException(`User với ID ${id} không tồn tại`);
      }

      logger.log(`Fetched user ID: ${id}`);
      return this.sanitizeUser(user);  // UserResponse (full id)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error(`Find one user ${id} failed: ${error.message}`);
      throw new NotFoundException('Lỗi khi lấy thông tin user');
    }
  }

  // Cập nhật user 
  async update(id: number, updateDto: Partial<{ email?: string; password?: string; role?: UserRole }>): Promise<UserResponse> {
    try {
      const user = await this.findOne(id);  


      const fullUser = await this.usersRepository.findOne({ 
        where: { id },
        select: ['id', 'email', 'password', 'role', 'createdAt', 'updatedAt']  
      }) as User;  

      if (updateDto.email && updateDto.email !== fullUser.email) {
        await this.checkEmailExists(updateDto.email, id);
        fullUser.email = updateDto.email.toLowerCase();
      }

      if (updateDto.password) {
        if (updateDto.password.length < 6) {
          throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
        }
        fullUser.password = await bcrypt.hash(updateDto.password, 10);
      }

      if (updateDto.role) {
        fullUser.role = updateDto.role;
      }

      const updatedUser = await this.usersRepository.save(fullUser);
      logger.log(`User updated: ID ${id} (email: ${updatedUser.email})`);
      
      return this.sanitizeUser(updatedUser);  
    } catch (error) {
      logger.error(`Update user ${id} failed: ${error.message}`);
      throw error;
    }
  }

  // Xóa user theo ID (void, no return)
  async delete(id: number): Promise<void> {
    try {
      const result = await this.usersRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException('User không tồn tại để xóa');
      }
      logger.log(`User deleted successfully: ID ${id}`);
    } catch (error) {
      logger.error(`Delete user ${id} failed: ${error.message}`);
      throw error;
    }
  }


  private sanitizeUser(user: User): UserResponse {  
    const { password, ...sanitized } = user;  
    return sanitized;  
  }
}
