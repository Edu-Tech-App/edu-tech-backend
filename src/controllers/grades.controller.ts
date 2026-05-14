import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Get, Param, ParseIntPipe, UseGuards, Query, Req, Put, ForbiddenException } from '@nestjs/common';
import { GradesService } from '../services/grades.service';
import { CreateGradeDto, UpdateGradeDto } from '../dto/grades/grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.DOCENTE)
  async create(@Body() createGradeDto: CreateGradeDto, @Req() req: any) {
    const docenteId = req.user.userId;
    return this.gradesService.create(createGradeDto, docenteId);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.DOCENTE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGradeDto: UpdateGradeDto,
    @Req() req: any,
  ) {
    const docenteId = req.user.userId;
    return this.gradesService.update(id, updateGradeDto, docenteId);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATIVO, UserRole.DOCENTE)
  async findAll(
    @Query('periodo') periodoAcademico?: string,
    @Query('asignatura') asignaturaId?: number,
  ) {
    return this.gradesService.findAll({ periodoAcademico, asignaturaId: Number(asignaturaId) });
  }

  @Get('estudiante/:id')
  async findByEstudiante(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Query('periodo') periodoAcademico?: string,
  ) {
    const userId = req.user.userId;
    const userRol = req.user.rol;
    
    if (userRol === UserRole.ESTUDIANTE && id !== userId) {
      throw new ForbiddenException('No puedes ver las calificaciones de otros estudiantes');
    }
    
    return this.gradesService.findByEstudiante(id, periodoAcademico);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.findOne(id);
  }
}
