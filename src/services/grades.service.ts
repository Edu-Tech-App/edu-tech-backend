import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../entities/grade.entity';
import { CreateGradeDto, UpdateGradeDto } from '../dto/grades/grade.dto';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private gradesRepository: Repository<Grade>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createGradeDto: CreateGradeDto, docenteId: number) {
    const { estudianteId, asignaturaId, periodoAcademico, valor } = createGradeDto;

    if (valor < 0 || valor > 5) {
      throw new BadRequestException('La nota debe estar entre 0 y 5');
    }

    const docente = await this.usersRepository.findOne({
      where: { id: docenteId },
    });

    if (!docente || docente.rol !== UserRole.DOCENTE) {
      throw new ForbiddenException('Solo los docentes pueden registrar calificaciones');
    }

    const grade = this.gradesRepository.create({
      estudianteId,
      asignaturaId,
      periodoAcademico,
      valor,
      docenteId,
    });

    await this.gradesRepository.save(grade);

    return grade;
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

    grade.valorAnterior = grade.valor;
    grade.valor = valor;
    grade.actualizadoPor = docenteId;

    await this.gradesRepository.save(grade);

    return grade;
  }

  async findAll(filters: { periodoAcademico?: string; asignaturaId?: number }) {
    const query = this.gradesRepository.createQueryBuilder('grade')
      .leftJoinAndSelect('grade.estudiante', 'estudiante')
      .select([
        'grade.id',
        'grade.periodoAcademico',
        'grade.valor',
        'grade.fechaRegistro',
        'grade.asignaturaId',
        'estudiante.id',
        'estudiante.nombreCompleto',
      ]);

    if (filters.periodoAcademico) {
      query.andWhere('grade.periodoAcademico = :periodo', { periodo: filters.periodoAcademico });
    }

    if (filters.asignaturaId) {
      query.andWhere('grade.asignaturaId = :asignaturaId', { asignaturaId: filters.asignaturaId });
    }

    return query.getMany();
  }

  async findByEstudiante(estudianteId: number, periodoAcademico?: string) {
    const query = this.gradesRepository.createQueryBuilder('grade')
      .leftJoinAndSelect('grade.estudiante', 'estudiante')
      .where('grade.estudianteId = :estudianteId', { estudianteId });

    if (periodoAcademico) {
      query.andWhere('grade.periodoAcademico = :periodo', { periodo: periodoAcademico });
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
