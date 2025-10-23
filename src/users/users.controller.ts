import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Query,
  Req,  // Thêm Req để access full request
  Logger,  // Thêm Logger
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from '../auth/dto/user.dto';  
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';  
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';  

@ApiTags('Users')  
@ApiBearerAuth()  
@Controller('api/v1/user')
@UseGuards(JwtAuthGuard)  
export class UsersController {
  private readonly logger = new Logger(UsersController.name);  

  constructor(private readonly usersService: UsersService) {}

  // GET /api/v1/user: Lấy tất cả users (admin only)
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List users' })
  async findAll(@Req() req: any) { 
    this.logger.log(`Received GET /api/v1/user request - Headers: ${JSON.stringify(req.headers)}, Query: ${JSON.stringify(req.query)}`);
    const users = await this.usersService.findAll();
    if (users.length === 0) {
      throw new NotFoundException('Không có user nào trong hệ thống.');
    }
    const response = { 
      data: users.map((user, index) => ({
        index: index + 1,
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toLocaleDateString('vi-VN'),
      })),
      count: users.length 
    };
    this.logger.log(`GET /api/v1/user response: ${JSON.stringify(response)}`);  
    return response;
  }

  // GET /api/v1/user/search?query=... : Tìm kiếm users by email/role (admin/user)
  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Search users by email or role' })
  @ApiQuery({ name: 'query', description: 'Email or role keyword' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('query') query: string, @Req() req: any) {
    this.logger.log(`Received GET /api/v1/user/search request - Query: ${query}, Headers: ${JSON.stringify(req.headers)}`);  // Log query, headers
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Vui lòng nhập từ khóa tìm kiếm.');
    }
    const users = await this.usersService.search(query.trim());
    if (users.length === 0) {
      throw new NotFoundException('Không tìm thấy user nào.');
    }
    const response = { 
      data: users.map((user, index) => ({
        index: index + 1,
        id: user.id,
        email: user.email,
        role: user.role,
      })),
      count: users.length 
    };
    this.logger.log(`GET /api/v1/user/search response: ${JSON.stringify(response)}`);  // Log response
    return response;
  }

  // GET /api/v1/user/:id: Lấy 1 user theo ID (admin only) - Thêm log
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    this.logger.log(`Received GET /api/v1/user/${id} request - Headers: ${JSON.stringify(req.headers)}`);  // Log params, headers
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }
    const response = { 
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    };
    this.logger.log(`GET /api/v1/user/${id} response: ${JSON.stringify(response)}`);  // Log response
    return response;
  }

  // POST /api/v1/user/create: Tạo user mới (admin only) - Thêm log
  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    this.logger.log(`Received POST /api/v1/user/create request - Body: ${JSON.stringify(createUserDto)}, Headers: ${JSON.stringify(req.headers)}`);  // Log body, headers
    if (createUserDto.password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự.');
    }
    const newUser = await this.usersService.create(createUserDto);
    const response = { 
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      message: 'User created successfully'
    };
    this.logger.log(`POST /api/v1/user/create response: ${JSON.stringify(response)}`);  // Log response
    return response;
  }

  // PUT /api/v1/user/update/:id: Update user (admin only) - Thêm log
  @Put('update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    this.logger.log(`Received PUT /api/v1/user/update/${id} request - Body: ${JSON.stringify(updateUserDto)}, Headers: ${JSON.stringify(req.headers)}`);  // Log body, params, headers
    const existingUser = await this.usersService.findOne(id);
    if (!existingUser) {
      throw new NotFoundException(`User ID ${id} không tồn tại.`);
    }
    const updatedUser = await this.usersService.update(id, updateUserDto);
    const response = { 
      data: updatedUser,
      message: 'User updated successfully'
    };
    this.logger.log(`PUT /api/v1/user/update/${id} response: ${JSON.stringify(response)}`);  // Log response
    return response;
  }

  // DELETE /api/v1/user/delete/:id: Xóa user (admin only) - Thêm log (nếu có route delete)
  @Delete('delete/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    this.logger.log(`Received DELETE /api/v1/user/delete/${id} request - Headers: ${JSON.stringify(req.headers)}`);  // Log params, headers
    await this.usersService.delete(id);
    this.logger.log(`DELETE /api/v1/user/delete/${id} success - User deleted`);
    return { message: 'User deleted successfully' };
  }
}
