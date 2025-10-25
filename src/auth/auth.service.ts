// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserResponse, Role } from '../database/entities/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  roles: string[]; 
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}
  
  async register(dto: RegisterDto): Promise<{ message: string; user: UserResponse }> {
    const input: CreateUserDto = { email: dto.email, password: dto.password, role: Role.User };
    const result = await this.userService.createUser(input);
    if (!result.success || !result.user) {
      throw new BadRequestException(result.error || 'Đăng ký thất bại.');
    }
    return { message: 'Đăng ký thành công!', user: result.user };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken?: string}> {
    const user = await this.userService.getUserByEmail(loginDto.email);
    if (!user || !loginDto.password || !user.password) {
      throw new UnauthorizedException('Email hoặc password không đúng.');
    }
    const ok = await this.userService.comparePassword(loginDto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Email hoặc password không đúng.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: [user.role ?? Role.User], 
    };

    const accessSecret = this.config.get<string>('JWT_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: '24h',
    });

    const refreshToken = refreshSecret
      ? this.jwtService.sign(payload, { secret: refreshSecret, expiresIn: '7d' })
      : undefined;

    const { password, ...userResponse } = user;
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token không hợp lệ.');
    }
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, { secret: refreshSecret });
      const accessSecret = this.config.get<string>('JWT_SECRET');
      const newAccess = this.jwtService.sign(
        { sub: payload.sub, email: payload.email, roles: payload.roles },
        { secret: accessSecret, expiresIn: '15m' },
      );
      return { accessToken: newAccess };
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ.');
    }
  }

  async validateUserByPayload(payload: JwtPayload): Promise<UserResponse> {
    const user = await this.userService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User không tồn tại.');
    }
    const { password, ...result } = user;
    return result as UserResponse;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email.toLowerCase());
    if (!user || !password || !user.password) return null;
    const ok = await this.userService.comparePassword(password, user.password);
    if (!ok) return null;
    const { password: _, ...safe } = user;
    return safe;
  }
}
