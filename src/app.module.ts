import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';  
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from './database/entities/user.entity';
import { ShortUrl } from './database/entities/short-url.entity';
import { Click } from './database/entities/click.entity';
import { RateLimit } from './database/entities/rate-limit.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: '.env',
      validate: (config) => {
        if (!config.DATABASE_PASSWORD || typeof config.DATABASE_PASSWORD !== 'string') {
          throw new Error('DATABASE_PASSWORD must be a non-empty string in .env');
        }
        if (!config.JWT_SECRET || typeof config.JWT_SECRET !== 'string') {
          throw new Error('JWT_SECRET must be a non-empty string in .env');
        }
        return config;
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const password = configService.get<string>('DATABASE_PASSWORD');
        if (!password || typeof password !== 'string') {
          throw new Error('Invalid DATABASE_PASSWORD: must be a string');
        }
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: configService.get<number>('DATABASE_PORT', 5432),
          username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
          password: password,
          database: configService.get<string>('DATABASE_NAME', 'url_shortener'),
          synchronize: false,  
          logging: true,  
          entities: [User, ShortUrl, Click, RateLimit],
          migrations: ['dist/database/migrations/*{.ts,.js}'],
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => AuthModule),  
    forwardRef(() => UsersModule),  
  ],
})
export class AppModule {}
