// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserResponse, Role } from '../database/entities/user.entity';

export interface JwtPayload {
  sub: number;   // User ID
  email: string;
  roles: string[]; // luôn là mảng để RBAC includes hoạt động
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // Đăng ký (public): ép role = user để ngăn leo quyền
  async register(dto: RegisterDto): Promise<{ message: string; user: UserResponse }> {
    const input: CreateUserDto = { email: dto.email, password: dto.password, role: Role.User };
    const result = await this.userService.createUser(input);
    if (!result.success || !result.user) {
      throw new BadRequestException(result.error || 'Đăng ký thất bại.');
    }
    return { message: 'Đăng ký thành công!', user: result.user };
  }

  // Đăng nhập
  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: UserResponse }> {
    const user = await this.userService.getUserByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc password không đúng.');
    }
    const isPasswordValid = await this.userService.comparePassword(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc password không đúng.');
    }

    // role trong DB là ENUM đơn → chuẩn hóa thành mảng roles cho RBAC
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: [user.role ?? Role.User],
    };

    const accessToken = this.jwtService.sign(payload);
    const { password, ...userResponse } = user;
    return { accessToken, user: userResponse as UserResponse };
  }

  // Dùng cho JwtStrategy validate theo id trong payload
  async validateUserByPayload(payload: JwtPayload): Promise<UserResponse> {
    const user = await this.userService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User không tồn tại.');
    }
    const { password, ...result } = user;
    return result as UserResponse;
  }

  // Tiện ích kiểm tra mật khẩu
  async validateUserPassword(email: string, password: string): Promise<boolean> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) return false;
    return this.userService.comparePassword(password, user.password);
  }
}
