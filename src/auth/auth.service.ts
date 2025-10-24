import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserResponse } from '../database/entities/user.entity';  // Import User và StudentResponse

export interface JwtPayload {
  sub: number;  // User ID
  email: string;
  roles: string[];  // Cập nhật thành array để match entity User.roles
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký user mới
   */
  async register(createUserDto: CreateUserDto): Promise<{ message: string; user: UserResponse }> {
    // Sử dụng UserService để tạo user với validation và hash password
    const result = await this.userService.createUser(createUserDto);
    if (!result.success || !result.user) {
      throw new BadRequestException(result.error || 'Đăng ký thất bại.');
    }

    // result.student đã là StudentResponse (no password từ UserService)
    return {
      message: 'Đăng ký thành công!',
      user: result.user,
    };
  }

  /**
   * Đăng nhập user
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: UserResponse }> {
    // Tìm user bằng email - Fix: Dùng getUserByEmail thay vì getUserByIdFromEmail
    const user = await this.userService.getUserByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc password không đúng.');
    }

    // Validate password với UserService (sử dụng bcrypt.compare nội bộ)
    const isPasswordValid = await this.userService.comparePassword(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc password không đúng.');
    }

    // Tạo JWT payload với roles array (từ entity)
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.role || ['user'],  // Default nếu rỗng
    };

    // Generate token
    const accessToken = this.jwtService.sign(payload);

    // Trả StudentResponse (no password)
    const { password, ...userResponse } = user;
    return {
      accessToken,
      user: userResponse as UserResponse,  // Cast để match type
    };
  }

  /**
   * Validate user từ JWT payload (dùng cho JwtStrategy)
   */
  async validateUserByPayload(payload: JwtPayload): Promise<UserResponse> {
    const user = await this.userService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User không tồn tại.');
    }

    // Không trả password (dùng StudentResponse type)
    const { password, ...result } = user;
    return result as UserResponse;
  }

  /**
   * Kiểm tra password (nếu cần cho reset password)
   */
  async validateUserPassword(email: string, password: string): Promise<boolean> {
    // Fix: Dùng getUserByEmail thay vì getUserByIdFromEmail
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      return false;
    }
    // Sử dụng UserService comparePassword
    return await this.userService.comparePassword(password, user.password);
  }
}
