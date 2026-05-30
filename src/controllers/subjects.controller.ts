import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubjectsService } from '../services/subjects.service';
import { CreateSubjectDto } from '../dto/subjects/create-subject.dto';
import { UpdateSubjectDto } from '../dto/subjects/update-subject.dto';
import { EnrollSubjectDto } from '../dto/subjects/enroll-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  private assertOwnStudentAction(estudianteId: number, req: any) {
    const userRol = req.user.rol;
    const userId = req.user.userId || req.user.id;

    if (userRol === UserRole.ESTUDIANTE && estudianteId !== userId) {
      throw new ForbiddenException('Solo puedes gestionar inscripciones para tu propio usuario');
    }
  }

  @Post()
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR)
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.DOCENTE, UserRole.ESTUDIANTE)
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get('enrollments/my')
  @Roles(UserRole.ESTUDIANTE)
  @ApiOperation({ summary: 'Listar mis materias inscritas' })
  findMyEnrollments(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.subjectsService.findEnrollmentsByStudent(userId);
  }

  @Post(':id/enrollments')
  @Roles(UserRole.ESTUDIANTE, UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Inscribir un estudiante en una materia' })
  @ApiBody({
    type: EnrollSubjectDto,
    examples: {
      estudiante: {
        summary: 'Inscripcion propia de estudiante',
        value: {
          estudianteId: 1,
        },
      },
      administrativo: {
        summary: 'Inscripcion realizada por administracion',
        value: {
          estudianteId: 1,
        },
      },
    },
  })
  enrollStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body() enrollSubjectDto: EnrollSubjectDto,
    @Req() req: any,
  ) {
    this.assertOwnStudentAction(enrollSubjectDto.estudianteId, req);
    return this.subjectsService.enrollStudent(id, enrollSubjectDto.estudianteId);
  }

  @Get(':id/enrollments')
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.DOCENTE)
  @ApiOperation({ summary: 'Listar estudiantes inscritos en una materia' })
  findSubjectEnrollments(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findEnrollmentsBySubject(id);
  }

  @Delete(':id/enrollments/:studentId')
  @Roles(UserRole.ESTUDIANTE, UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Retirar la inscripcion de un estudiante en una materia' })
  removeEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: any,
  ) {
    this.assertOwnStudentAction(studentId, req);
    return this.subjectsService.removeEnrollment(id, studentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(id);
  }
}
