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

  private async ensureRoleProfile(user: User) {
    if (this.isStudentRole(String(user.rol))) {
      const existingStudent = await this.studentRepository.findOne({
        where: { usuarioId: user.id },
      });

      if (!existingStudent) {
        const student = this.studentRepository.create({
          usuarioId: user.id,
          codigoEstudiantil: `EST-${user.id}`,
          carrera: 'Por definir',
          semestreActual: 1,
        });
        await this.studentRepository.save(student);
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
    const { nombreCompleto, documentoIdentidad, correo, password, rol } = registerDto;

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
    await this.ensureRoleProfile(user);

    const response = {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      correoInstitucional: user.correoInstitucional,
      rol: user.rol,
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
    await this.ensureRoleProfile(user);

    return {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      correoInstitucional: user.correoInstitucional,
      rol: user.rol,
      estado: user.estado,
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
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'nombreCompleto', 'correoInstitucional', 'rol', 'estado'],
    });
  }
}
