import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../entities/grade.entity';
import { CreateGradeDto, UpdateGradeDto } from '../dto/grades/grade.dto';
import { User, UserRole } from '../entities/user.entity';
import { Subject } from '../entities/subject.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private gradesRepository: Repository<Grade>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createGradeDto: CreateGradeDto, docenteId: number) {
    const { estudianteId, asignaturaId, periodoAcademico, valor } =
      createGradeDto;

    if (valor < 0 || valor > 5) {
      throw new BadRequestException('La nota debe estar entre 0 y 5');
    }

    const docente = await this.usersRepository.findOne({
      where: { id: docenteId },
    });

    if (!docente || docente.rol !== UserRole.DOCENTE) {
      throw new ForbiddenException(
        'Solo los docentes pueden registrar calificaciones',
      );
    }

    const asignatura = await this.subjectsRepository.findOne({
      where: { id: asignaturaId },
    });
    if (!asignatura) {
      throw new NotFoundException('Asignatura no encontrada');
    }

    //Validación de titularidad (HU-03)
    if (asignatura.docenteId !== docenteId) {
      throw new ForbiddenException(
        'No eres el docente titular asignado a esta asignatura',
      );
    }

    const grade = this.gradesRepository.create({
      estudianteId,
      asignaturaId,
      periodoAcademico,
      valor,
      docenteId,
    });

    const savedGrade = await this.gradesRepository.save(grade);

    // Notificar al estudiante
    const user = await this.usersRepository.findOne({
      where: { id: estudianteId },
    });

    if (user && user.correoInstitucional) {
      void this.notificationsService.sendGradeNotification(
        user.correoInstitucional,
        user.nombreCompleto,
        asignatura.nombre,
        valor,
      );
    }

    return savedGrade;
  }

  async update(id: number, updateGradeDto: UpdateGradeDto, docenteId: number) {
    const { valor } = updateGradeDto;

    if (valor < 0 || valor > 5) {
      throw new BadRequestException('La nota debe estar entre 0 y 5');
    }

    const grade = await this.gradesRepository.findOne({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException('Calificación no encontrada');
    }

    const asignatura = await this.subjectsRepository.findOne({
      where: { id: grade.asignaturaId },
    });

    // ✅ Validación de titularidad (HU-04)
    if (!asignatura || asignatura.docenteId !== docenteId) {
      throw new ForbiddenException(
        'No eres el docente titular asignado a esta asignatura y no puedes modificar la nota',
      );
    }

    grade.valorAnterior = grade.valor;
    grade.valor = valor;
    grade.actualizadoPor = docenteId;

    const savedGrade = await this.gradesRepository.save(grade);

    // Notificar al estudiante
    const user = await this.usersRepository.findOne({
      where: { id: grade.estudianteId },
    });

    if (user && user.correoInstitucional) {
      void this.notificationsService.sendGradeNotification(
        user.correoInstitucional,
        user.nombreCompleto,
        asignatura ? asignatura.nombre : 'Asignatura ID: ' + grade.asignaturaId,
        valor,
        true,
      );
    }

    return savedGrade;
  }

  async findAll(filters: { periodoAcademico?: string; asignaturaId?: number }) {
    const query = this.gradesRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.estudiante', 'estudiante')
      .leftJoinAndSelect('estudiante.user', 'studentUser')
      .leftJoinAndSelect('grade.asignatura', 'asignatura');

    if (filters.periodoAcademico) {
      query.andWhere('grade.periodoAcademico = :periodo', {
        periodo: filters.periodoAcademico,
      });
    }

    if (filters.asignaturaId) {
      query.andWhere('grade.asignaturaId = :asignaturaId', {
        asignaturaId: filters.asignaturaId,
      });
    }

    return query.getMany();
  }

  async findByEstudiante(estudianteId: number, periodoAcademico?: string) {
    const query = this.gradesRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.estudiante', 'estudiante')
      .leftJoinAndSelect('estudiante.user', 'studentUser')
      .leftJoinAndSelect('grade.asignatura', 'asignatura')
      .where('grade.estudianteId = :estudianteId', { estudianteId });

    if (periodoAcademico) {
      query.andWhere('grade.periodoAcademico = :periodo', {
        periodo: periodoAcademico,
      });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    return this.gradesRepository.findOne({
      where: { id },
      relations: ['estudiante'],
    });
  }
}
