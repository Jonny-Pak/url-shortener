import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';  
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { User } from '../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module'; 
import { UserRepository } from './users.repository' 

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),  
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UsersModule {}
