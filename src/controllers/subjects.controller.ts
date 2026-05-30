import {
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { SubjectsService } from '../services/subjects.service';
import { CreateSubjectDto } from '../dto/subjects/create-subject.dto';
import { UpdateSubjectDto } from '../dto/subjects/update-subject.dto';
import { EnrollSubjectDto } from '../dto/subjects/enroll-subject.dto';
import { CreateSubjectTaskDto, SubmitSubjectTaskDto } from '../dto/subjects/create-subject-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const taskUploadsDir = join(process.cwd(), 'uploads', 'subject-tasks');

if (!existsSync(taskUploadsDir)) {
  mkdirSync(taskUploadsDir, { recursive: true });
}

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
  @Roles(UserRole.ADMINISTRATIVO)
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @Roles(UserRole.ADMINISTRATIVO, UserRole.DOCENTE, UserRole.ESTUDIANTE)
  findAll(@Req() req: any) {
    const userRol = req.user.rol;
    const userId = req.user.userId || req.user.id;

    if (userRol === UserRole.ESTUDIANTE) {
      return this.subjectsService.findForStudent(userId);
    }
    return this.subjectsService.findAll();
  }

  @Get('enrollments/my')
  @Roles(UserRole.ESTUDIANTE)
  @ApiOperation({ summary: 'Listar mis materias inscritas' })
  findMyEnrollments(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.subjectsService.findEnrollmentsByStudent(userId);
  }

  @Get('student/profile')
  @Roles(UserRole.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener perfil academico del estudiante autenticado' })
  findMyStudentProfile(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.subjectsService.findStudentProfile(userId);
  }

  @Get(':id/tasks')
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE, UserRole.ADMINISTRATIVO)
  @ApiOperation({ summary: 'Listar tareas de una materia' })
  findSubjectTasks(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.subjectsService.findTasksBySubject(id, userId, req.user.rol);
  }

  @Post(':id/tasks')
  @Roles(UserRole.DOCENTE, UserRole.ADMINISTRATIVO)
  @ApiOperation({ summary: 'Crear tarea para estudiantes inscritos' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: taskUploadsDir,
        filename: (_req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `task-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  createTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSubjectTaskDto,
    @Req() req: any,
    @UploadedFile() file?: { filename: string },
  ) {
    const userId = req.user.userId || req.user.id;
    return this.subjectsService.createTask(
      id,
      userId,
      dto.titulo,
      dto.descripcion,
      file ? `/uploads/subject-tasks/${file.filename}` : null,
    );
  }

  @Post('tasks/:taskId/submissions')
  @Roles(UserRole.ESTUDIANTE)
  @ApiOperation({ summary: 'Subir entrega de una tarea' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: taskUploadsDir,
        filename: (_req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `submission-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  submitTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: SubmitSubjectTaskDto,
    @Req() req: any,
    @UploadedFile() file?: { filename: string },
  ) {
    if (!file && !dto.mensaje) {
      throw new BadRequestException('Debes subir un archivo o escribir un mensaje');
    }

    const userId = req.user.userId || req.user.id;
    return this.subjectsService.submitTask(
      taskId,
      userId,
      dto.mensaje,
      file ? `/uploads/subject-tasks/${file.filename}` : null,
    );
  }

  @Post(':id/enrollments')
  @Roles(UserRole.ESTUDIANTE, UserRole.ADMINISTRATIVO)
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
  @Roles(UserRole.ADMINISTRATIVO, UserRole.DOCENTE)
  @ApiOperation({ summary: 'Listar estudiantes inscritos en una materia' })
  findSubjectEnrollments(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findEnrollmentsBySubject(id);
  }

  @Delete(':id/enrollments/:studentId')
  @Roles(UserRole.ESTUDIANTE, UserRole.ADMINISTRATIVO)
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
  @Roles(UserRole.ADMINISTRATIVO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATIVO)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(id);
  }
}
