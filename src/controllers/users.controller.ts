import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Get, Param, ParseIntPipe, Put, Patch } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { RegisterUserDto } from '../dto/users/register-user.dto';
import { UpdateUserDto, UpdateUserStatusDto } from '../dto/users/update-user.dto';
import { Public } from '../auth/decorators/public.decorator';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Public()
  async register(@Body() registerDto: RegisterUserDto) {
    return this.usersService.register(registerDto);
  }

  // ✅ Sin @UseGuards ni @Roles — el guard global JWT ya lo protege
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }
}
