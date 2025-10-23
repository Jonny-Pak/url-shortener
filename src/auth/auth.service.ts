import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException,  // Fix: Thay InternalServerException bằng InternalServerErrorException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../database/entities/user.entity';  // Import enum nếu cần (cho DTO)

const logger = new Logger('AuthService');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { email, password } = registerDto;

      const savedUser = await this.usersService.create({
        email,
        password, 
        role: registerDto.role || UserRole.USER,  
      });

      // 2. Validate JWT secrets từ .env
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!jwtSecret || !jwtRefreshSecret) {
        logger.error('JWT secrets not configured in .env');
        throw new BadRequestException('JWT secrets must be configured. Please check .env file.');
      }

      // 3. Generate tokens
      const payload = { sub: savedUser.id, email: savedUser.email, role: savedUser.role };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '1h',  // Access token ngắn hạn
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: '7d',  // Refresh token dài hạn
      });

      logger.log(`User registered successfully: ${email} (role: ${savedUser.role})`);
      return { 
        user: {
          id: savedUser.id,
          email: savedUser.email,
          role: savedUser.role,
        },
      };
    } catch (error) {
      logger.error(`Register failed for ${registerDto?.email}: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw new ConflictException('Email đã được sử dụng');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Fix: Thay InternalServerException bằng InternalServerErrorException
      throw new InternalServerErrorException('Lỗi server nội bộ khi đăng ký. Vui lòng thử lại.');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // 1. Tìm user (bao gồm password để verify)
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      // 2. Verify password (bcrypt compare – hashed trong DB)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Invalid password for email: ${email}`);
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      // 3. Validate JWT secrets
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!jwtSecret || !jwtRefreshSecret) {
        logger.error('JWT secrets not configured in .env');
        throw new BadRequestException('JWT secrets must be configured. Please check .env file.');
      }

      // 4. Generate tokens
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '1h',
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: '7d',
      });

      logger.log(`User logged in: ${email} (role: ${user.role})`);
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      logger.error(`Login failed for ${loginDto.email}: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Fix: Thay InternalServerException bằng InternalServerErrorException
      throw new InternalServerErrorException('Lỗi server nội bộ khi đăng nhập. Vui lòng thử lại.');
    }
  }

  // Optional: Refresh token method (cho endpoint /auth/refresh)
  async refreshToken(refreshToken: string) {
    try {
      const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!jwtRefreshSecret) {
        throw new BadRequestException('JWT refresh secret not configured');
      }

      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, { secret: jwtRefreshSecret });
      const user = await this.usersService.findOne(payload.sub as number);
      if (!user) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Generate new access token
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const newAccessToken = this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { secret: jwtSecret, expiresIn: '1h' },
      );

      return { access_token: await newAccessToken };
    } catch (error) {
      logger.error('Refresh token failed: ' + error.message);
      throw new UnauthorizedException('Token refresh không hợp lệ');
    }
  }
}
