import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { CreateSubjectDto } from '../dto/subjects/create-subject.dto';
import { UpdateSubjectDto } from '../dto/subjects/update-subject.dto';
import { Teacher } from '../entities/teacher.entity';
import { Student } from '../entities/student.entity';
import { User, UserRole } from '../entities/user.entity';
import { SubjectEnrollment } from '../entities/subject-enrollment.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SubjectEnrollment)
    private readonly enrollmentRepository: Repository<SubjectEnrollment>,
  ) {}

  private getCareerPrefix(carrera: string) {
    const prefixes: Record<string, string> = {
      INGENIERIA_SISTEMAS: 'SIS',
      INGENIERIA_CIVIL: 'CIV',
      INGENIERIA_INDUSTRIAL: 'IND',
      ADMINISTRACION: 'ADM',
      CONTADURIA: 'CON',
      ECONOMIA: 'ECO',
      DERECHO: 'DER',
      MEDICINA: 'MED',
      ENFERMERIA: 'ENF',
      PSICOLOGIA: 'PSI',
      EDUCACION: 'EDU',
      MATEMATICAS: 'MAT',
    };

    return prefixes[carrera] ?? 'GEN';
  }

  private async generateSubjectCode(carrera: string) {
    const prefix = this.getCareerPrefix(carrera);
    const existingSubjects = await this.subjectRepository.find({
      where: { carrera: carrera as any },
      select: ['codigo'],
    });

    const maxSequence = existingSubjects.reduce((max, subject) => {
      const match = subject.codigo?.match(/-(\d+)$/);
      const current = match ? Number(match[1]) : 0;
      return current > max ? current : max;
    }, 0);

    return `${prefix}-${String(maxSequence + 1).padStart(3, '0')}`;
  }

  private async ensureStudentProfile(estudianteId: number): Promise<Student> {
    let student = await this.studentRepository.findOneBy({ usuarioId: estudianteId });

    if (student) {
      return student;
    }

    const user = await this.userRepository.findOneBy({ id: estudianteId });

    if (!user || user.rol !== UserRole.ESTUDIANTE) {
      throw new BadRequestException('El usuario indicado no existe o no tiene rol de estudiante');
    }

    student = this.studentRepository.create({
      usuarioId: user.id,
      codigoEstudiantil: `EST-${user.id}`,
      carrera: 'Por definir',
      semestreActual: 1,
    });

    return this.studentRepository.save(student);
  }

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    if (createSubjectDto.docenteId) {
      const teacher = await this.teacherRepository.findOne({
        where: { usuarioId: createSubjectDto.docenteId },
      });

      if (!teacher) {
        throw new BadRequestException('El docente seleccionado no existe en el registro de docentes');
      }
    }

    const subjectCode =
      createSubjectDto.codigo || (await this.generateSubjectCode(createSubjectDto.carrera));

    const subject = this.subjectRepository.create({
      ...createSubjectDto,
      codigo: subjectCode,
    });
    return this.subjectRepository.save(subject);
  }

  async findAll(): Promise<any[]> {
    const subjects = await this.subjectRepository.find({ relations: ['docente', 'docente.user'] });
    const counts = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.asignaturaId', 'subjectId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('enrollment.asignaturaId')
      .getRawMany();

    return subjects.map((s) => {
      const countObj = counts.find((c) => Number(c.subjectId) === s.id);
      return {
        ...s,
        inscritosCount: countObj ? Number(countObj.count) : 0,
      };
    });
  }

  async findForStudent(estudianteId: number): Promise<any[]> {
    const student = await this.studentRepository.findOneBy({ usuarioId: estudianteId });

    let subjects: Subject[];

    // Si no tiene carrera o es 'Por definir', ve todas
    if (!student || !student.carrera || student.carrera === 'Por definir') {
      subjects = await this.subjectRepository.find({ relations: ['docente', 'docente.user'] });
    } else {
      subjects = await this.subjectRepository.find({
        where: { carrera: student.carrera as any },
        relations: ['docente', 'docente.user'],
      });
    }

    const counts = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.asignaturaId', 'subjectId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('enrollment.asignaturaId')
      .getRawMany();

    return subjects.map((s) => {
      const countObj = counts.find((c) => Number(c.subjectId) === s.id);
      return {
        ...s,
        inscritosCount: countObj ? Number(countObj.count) : 0,
      };
    });
  }

  async findOne(id: number): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['docente', 'docente.user'],
    });
    if (!subject) {
      throw new NotFoundException(`Asignatura con ID ${id} no encontrada`);
    }
    return subject;
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findOne(id);

    if (updateSubjectDto.docenteId) {
      const teacher = await this.teacherRepository.findOne({
        where: { usuarioId: updateSubjectDto.docenteId },
      });

      if (!teacher) {
        throw new BadRequestException('El docente seleccionado no existe en el registro de docentes');
      }
    }

    this.subjectRepository.merge(subject, updateSubjectDto);
    return this.subjectRepository.save(subject);
  }

  async remove(id: number): Promise<void> {
    const subject = await this.findOne(id);
    await this.subjectRepository.remove(subject);
  }

  async enrollStudent(asignaturaId: number, estudianteId: number): Promise<SubjectEnrollment> {
    const subject = await this.findOne(asignaturaId);
    const student = await this.ensureStudentProfile(estudianteId);

    // Validación de carrera
    if (student.carrera && student.carrera !== 'Por definir') {
      if (subject.carrera !== student.carrera) {
        throw new BadRequestException(`No puedes inscribirte a esta materia. Pertenece a ${subject.carrera} y tu carrera es ${student.carrera}`);
      }
    }

    const existingEnrollment = await this.enrollmentRepository.findOneBy({
      asignaturaId,
      estudianteId,
    });

    if (existingEnrollment) {
      throw new BadRequestException('El estudiante ya esta inscrito en esta materia');
    }

    const enrollment = this.enrollmentRepository.create({
      asignaturaId,
      estudianteId,
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async findEnrollmentsBySubject(asignaturaId: number): Promise<SubjectEnrollment[]> {
    await this.findOne(asignaturaId);

    return this.enrollmentRepository.find({
      where: { asignaturaId },
      relations: ['estudiante', 'estudiante.user', 'asignatura'],
      order: { fechaInscripcion: 'DESC' },
    });
  }

  async findEnrollmentsByStudent(estudianteId: number): Promise<SubjectEnrollment[]> {
    await this.ensureStudentProfile(estudianteId);

    return this.enrollmentRepository.find({
      where: { estudianteId },
      relations: ['asignatura', 'asignatura.docente', 'asignatura.docente.user'],
      order: { fechaInscripcion: 'DESC' },
    });
  }

  async findStudentProfile(estudianteId: number): Promise<Student> {
    return this.ensureStudentProfile(estudianteId);
  }

  async removeEnrollment(asignaturaId: number, estudianteId: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOneBy({
      asignaturaId,
      estudianteId,
    });

    if (!enrollment) {
      throw new NotFoundException('No existe una inscripcion para ese estudiante y materia');
    }

    await this.enrollmentRepository.remove(enrollment);
  }
}
