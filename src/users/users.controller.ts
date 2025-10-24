import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/user') 
export class UserController {
  constructor(private readonly userService: UserService) { }

  // Thêm sinh viên mới (yêu cầu auth, chỉ admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('create')
  async addUser(@Body() body: CreateUserDto) {
    const password = body.password as string;
    const email = body.email as string;
    const role = body.role;
    const input: CreateUserDto = {
      email,
      password,
      role
    };
    const result = await this.userService.createUser(input);
    if (!result.success || !result.user) {
      throw new BadRequestException(result.error || 'Có lỗi xảy ra khi thêm sinh viên.');
    }
    return {
      message: 'Thêm người dùng thành công!',
      student: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
    };
  }

  // Lấy danh sách người dùng (yêu cầu auth)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('list')
  async listAllUser() {
    const user = await this.userService.getAllUser();
    if (user.length === 0) {
      throw new NotFoundException('Không có người dùng nào trong hệ thống.');
    }
    return {
      total: user.length,
      user: user.map((user, index) => ({
        index: index + 1,
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toLocaleDateString('vi-VN'),
      })),
    };
  }

  // Tìm kiếm users (yêu cầu auth, user hoặc admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @Get('search')
  async searchUser(@Query('query') query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Vui lòng nhập từ khóa tìm kiếm.');
    }
    const user = await this.userService.searchUser(query);
    if (user.length === 0) {
      throw new NotFoundException('Không tìm thấy người dùng nào.');
    }
    return {
      total: user.length,
      students: user.map((user, index) => ({
        index: index + 1,
        email: user.email,
      })),
    };
  }

  // Cập nhật thông tin (yêu cầu auth, chỉ admin hoặc owner - nhưng đơn giản hóa chỉ admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('update/:id')
  async updateUser(@Param('id') idStr: string, @Body() body: Partial<UpdateUserDto>) {
    const id = Number(idStr);
    if (isNaN(id)) {
      throw new BadRequestException('ID không hợp lệ. Vui lòng nhập số hợp lệ.');
    }
    const existingStudent = await this.userService.getUserById(id);
    if (!existingStudent) {
      throw new NotFoundException('Không tìm thấy người dùng với ID này.');
    }
    // if (existingStudent.age > 20 && existingStudent.gpa > 3) {
    //   throw new BadRequestException('Sinh viên này đã trên 20 tuổi hoặc GPA lớn hơn 3, không được update!');
    // }
    const updateData: UpdateUserDto = { id };
    if (body.email !== "") {
      updateData.email = body.email.trim();
    }
    if (body.password !== "") {
      updateData.password = body.password.trim();
    }
    console.log(updateData);
    const result = await this.userService.updateUser(updateData);
    if (!result.success) {
      throw new BadRequestException(result.error || 'Có lỗi xảy ra khi cập nhật.');
    }
    return { message: 'Cập nhật thông tin người dùng thành công!' };
  }

  // Xóa sinh viên (yêu cầu auth, chỉ admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('delete/:id')
  async deleteUser(@Param('id') idStr: string) {
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      throw new BadRequestException('ID không hợp lệ. Vui lòng nhập một số.');
    }
    const existingStudent = await this.userService.getUserById(id);
    if (!existingStudent) {
      throw new NotFoundException('Không tìm thấy sinh viên với ID này.');
    }
    const result = await this.userService.deleteUser(id);
    if (!result.success) {
      throw new BadRequestException(result.error || 'Có lỗi xảy ra khi xóa.');
    }
    return { message: 'Xóa sinh viên thành công!' };
  }
}
