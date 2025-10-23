import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { UserService } from '../users/users.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: UserService) { }

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
    const result = await this.studentService.createStudent(input);
    if (!result.success || !result.student) {
      throw new BadRequestException(result.error || 'Có lỗi xảy ra khi thêm sinh viên.');
    }
    return {
      message: 'Thêm sinh viên thành công!',
      student: {
        id: result.student.id,
        email: result.student.email,
        password: result.student.password,
        role: result.student.roles,
      },
    };
  }

  // Lấy danh sách sinh viên (yêu cầu auth)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('list')
  async listAllStudents() {
    const students = await this.studentService.getAllStudents();
    if (students.length === 0) {
      throw new NotFoundException('Không có sinh viên nào trong hệ thống.');
    }
    return {
      total: students.length,
      students: students.map((student, index) => ({
        index: index + 1,
        id: student.id,
        age: student.age,
        email: student.email,
        major: student.major,
        gpa: student.gpa.toFixed(2),
        createdAt: student.createdAt.toLocaleDateString('vi-VN'),
      })),
    };
  }

  // Tìm kiếm sinh viên (yêu cầu auth, user hoặc admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  @Get('search')
  async searchStudent(@Query('query') query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Vui lòng nhập từ khóa tìm kiếm.');
    }
    const students = await this.studentService.searchStudents(query);
    if (students.length === 0) {
      throw new NotFoundException('Không tìm thấy sinh viên nào.');
    }
    return {
      total: students.length,
      students: students.map((student, index) => ({
        index: index + 1,
        fullName: student.fullName,
        email: student.email,
        gpa: student.gpa.toFixed(2),
      })),
    };
  }

  // Cập nhật thông tin (yêu cầu auth, chỉ admin hoặc owner - nhưng đơn giản hóa chỉ admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('update/:id')
  async updateStudent(@Param('id') idStr: string, @Body() body: Partial<UpdateStudentDto>) {
    const id = Number(idStr);
    if (isNaN(id)) {
      throw new BadRequestException('ID không hợp lệ. Vui lòng nhập số hợp lệ.');
    }
    const existingStudent = await this.studentService.getStudentById(id);
    if (!existingStudent) {
      throw new NotFoundException('Không tìm thấy sinh viên với ID này.');
    }
    // if (existingStudent.age > 20 && existingStudent.gpa > 3) {
    //   throw new BadRequestException('Sinh viên này đã trên 20 tuổi hoặc GPA lớn hơn 3, không được update!');
    // }
    const updateData: UpdateStudentDto = { id };
    if (body.fullName?.trim()) {
      updateData.fullName = body.fullName.trim();
    }
    if (body.age !== undefined) {
      const age = parseInt(body.age as any);
      if (!isNaN(age)) {
        updateData.age = age;
      }
      if (age > 20) {
        throw new BadRequestException('Sinh viên này đã trên 20 tuổi, không được update!');
      }

    }
    if (body.email !== "") {
      updateData.email = body.email.trim();
    }
    if (body.major !== "") {
      updateData.major = body.major.trim();
    }
    if (body.gpa !== undefined) {
      const gpa = parseFloat(body.gpa as any);
      if (!isNaN(gpa)) {
        updateData.gpa = gpa;
      }
      if (gpa > 3) {
        throw new BadRequestException('Sinh viên này có GPA lớn hơn 3, không được update!');
      }
    }
    if (body.password !== "") {
      updateData.password = body.password.trim();
    }
    console.log(updateData);
    if (body.phone !== "") {
      const phone = body.phone as string;
      if (!/^\d{10}$/.test(phone)) {
        throw new BadRequestException('Số điện thoại phải đủ 10 số và phải là chữ số.');
      }
      updateData.phone = phone;
    }
    const result = await this.studentService.updateStudent(updateData);
    if (!result.success) {
      throw new BadRequestException(result.error || 'Có lỗi xảy ra khi cập nhật.');
    }
    return { message: 'Cập nhật thông tin sinh viên thành công!' };
  }

  // Xóa sinh viên (yêu cầu auth, chỉ admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('delete/:id')
  async deleteStudent(@Param('id') idStr: string) {
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      throw new BadRequestException('ID không hợp lệ. Vui lòng nhập một số.');
    }
    const existingStudent = await this.studentService.getStudentById(id);
    if (!existingStudent) {
      throw new NotFoundException('Không tìm thấy sinh viên với ID này.');
    }
    if (existingStudent.gpa > 3 && existingStudent.age < 20) {
      throw new BadRequestException('Sinh viên này có điểm GPA lớn hơn 3 hoặc số tuổi nhỏ hơn 20, không thể xóa!');
    }
    const result = await this.studentService.deleteStudent(id);
    if (!result.success) {
      throw new BadRequestException(result.error || 'Có lỗi xảy ra khi xóa.');
    }
    return { message: 'Xóa sinh viên thành công!' };
  }
}
