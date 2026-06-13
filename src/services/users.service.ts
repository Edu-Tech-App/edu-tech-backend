import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Teacher } from '../entities/teacher.entity';
import { RegisterUserDto } from '../dto/users/register-user.dto';
import { UpdateUserDto, UpdateUserStatusDto } from '../dto/users/update-user.dto';
import { NotificationsService } from './notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private isStudentRole(rol: string) {
    return rol === 'ESTUDIANTE' || rol === UserRole.ESTUDIANTE;
  }

  private isTeacherRole(rol: string) {
    return rol === 'DOCENTE' || rol === UserRole.DOCENTE;
  }

  private async ensureRoleProfile(user: User, carrera?: string) {
    if (this.isStudentRole(String(user.rol))) {
      let existingStudent = await this.studentRepository.findOne({
        where: { usuarioId: user.id },
      });

      if (!existingStudent) {
        existingStudent = this.studentRepository.create({
          usuarioId: user.id,
          codigoEstudiantil: `EST-${user.id}`,
          carrera: carrera?.trim() || 'Por definir',
          semestreActual: 1,
        });
        await this.studentRepository.save(existingStudent);
      } else if (typeof carrera === 'string') {
        existingStudent.carrera = carrera.trim() || 'Por definir';
        await this.studentRepository.save(existingStudent);
      }
    }

    if (this.isTeacherRole(String(user.rol))) {
      const existingTeacher = await this.teacherRepository.findOne({
        where: { usuarioId: user.id },
      });

      if (!existingTeacher) {
        const teacher = this.teacherRepository.create({
          usuarioId: user.id,
          especialidad: 'General',
          departamento: 'General',
          cubiculo: 'N/A',
        });
        await this.teacherRepository.save(teacher);
      }
    }
  }

  async register(registerDto: RegisterUserDto) {
    const { nombreCompleto, documentoIdentidad, correo, password, rol, carrera } = registerDto;

    if (this.isStudentRole(String(rol)) && !carrera?.trim()) {
      throw new ConflictException('La carrera es obligatoria para estudiantes');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { correoInstitucional: correo },
    });

    if (existingUser) {
      throw new ConflictException('El correo institucional ya está registrado');
    }

    const existingDoc = await this.usersRepository.findOne({
      where: { documentoIdentidad: documentoIdentidad },
    });

    if (existingDoc) {
      throw new ConflictException('El documento de identidad ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      nombreCompleto,
      documentoIdentidad,
      correoInstitucional: correo,
      passwordHash,
      rol: rol as UserRole,
      estado: UserStatus.ACTIVO,
    });

    await this.usersRepository.save(user);
    await this.ensureRoleProfile(user, carrera);

    const response = {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      correoInstitucional: user.correoInstitucional,
      rol: user.rol,
      carrera: this.isStudentRole(String(user.rol)) ? (carrera?.trim() || 'Por definir') : null,
    };

    // El alta del usuario no debe esperar la latencia del SMTP.
    void this.notificationsService.sendWelcomeEmail(
      user.correoInstitucional,
      user.nombreCompleto,
    );

    return response;
  }

  async update(id: number, updateDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateDto.correo && updateDto.correo !== user.correoInstitucional) {
      const existing = await this.usersRepository.findOne({
        where: { correoInstitucional: updateDto.correo },
      });
      if (existing) {
        throw new ConflictException('El correo ya está en uso');
      }
      user.correoInstitucional = updateDto.correo;
    }

    if (updateDto.documentoIdentidad && updateDto.documentoIdentidad !== user.documentoIdentidad) {
      const existing = await this.usersRepository.findOne({
        where: { documentoIdentidad: updateDto.documentoIdentidad },
      });
      if (existing) {
        throw new ConflictException('El documento ya está en uso');
      }
      user.documentoIdentidad = updateDto.documentoIdentidad;
    }

    if (updateDto.nombreCompleto) {
      user.nombreCompleto = updateDto.nombreCompleto;
    }

    if (updateDto.rol) {
      user.rol = updateDto.rol as UserRole;
    }

    if (updateDto.password) {
      user.passwordHash = await bcrypt.hash(updateDto.password, 10);
    }

    await this.usersRepository.save(user);
    await this.ensureRoleProfile(user, updateDto.carrera);

    const studentProfile = this.isStudentRole(String(user.rol))
      ? await this.studentRepository.findOne({ where: { usuarioId: user.id } })
      : null;

    return {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      correoInstitucional: user.correoInstitucional,
      rol: user.rol,
      estado: user.estado,
      carrera: studentProfile?.carrera ?? null,
    };
  }

  async updateStatus(id: number, updateStatusDto: UpdateUserStatusDto, adminId: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.estado = updateStatusDto.estado as UserStatus;
    user.actualizadoPorId = adminId;
    await this.usersRepository.save(user);

    return {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      correoInstitucional: user.correoInstitucional,
      rol: user.rol,
      estado: user.estado,
      actualizadoPorId: user.actualizadoPorId,
    };
  }

  async findAll() {
    return this.usersRepository.find({
      select: ['id', 'nombreCompleto', 'correoInstitucional', 'rol', 'estado'],
    });
  }

  async findTeachers() {
    const teachers = await this.teacherRepository.find({
      relations: ['user'],
    });

    return teachers.map((teacher) => ({
      id: teacher.usuarioId,
      nombreCompleto: teacher.user?.nombreCompleto ?? `Docente ${teacher.usuarioId}`,
    }));
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'nombreCompleto', 'correoInstitucional', 'rol', 'estado'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!this.isStudentRole(String(user.rol))) {
      return user;
    }

    const studentProfile = await this.studentRepository.findOne({
      where: { usuarioId: user.id },
    });

    return {
      ...user,
      carrera: studentProfile?.carrera ?? 'Por definir',
    };
  }
}
