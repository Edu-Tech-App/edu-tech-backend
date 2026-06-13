import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Get, Param, ParseIntPipe, Put, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { RegisterUserDto } from '../dto/users/register-user.dto';
import { UpdateUserDto, UpdateUserStatusDto } from '../dto/users/update-user.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMINISTRATIVO)
  async createUser(@Body() registerDto: RegisterUserDto) {
    return this.usersService.register(registerDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Public()
  async register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.register({
      ...registerDto,
      rol: 'ESTUDIANTE',
    });
  }

  @Get()
  @Roles(UserRole.ADMINISTRATIVO)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('teachers/list')
  @Roles(UserRole.ADMINISTRATIVO)
  async findTeachers() {
    return this.usersService.findTeachers();
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATIVO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // ✅ Cualquier usuario puede actualizar su propio perfil
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.userId || req.user.id;
    const isAdmin = req.user.rol === UserRole.ADMINISTRATIVO;

    // Solo el mismo usuario o un admin puede actualizar
    if (!isAdmin && requestingUserId !== id) {
      throw new Error('No tienes permiso para actualizar este perfil');
    }

    return this.usersService.update(id, updateDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMINISTRATIVO)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @Req() req: any,
  ) {
    const adminId = req.user.userId || req.user.id;
    return this.usersService.updateStatus(id, updateStatusDto, adminId);
  }
}
