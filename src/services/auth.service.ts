import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus, UserRole } from '../entities/user.entity';
import { LoginDto } from '../dto/auth/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto) {
    const { correo, password } = loginDto;

    console.log('Intento de login para:', correo);

    const user = await this.usersRepository.findOne({
      where: { correoInstitucional: correo },
    });

    if (!user) {
      console.log('Usuario no encontrado en DB');
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (user.estado !== UserStatus.ACTIVO) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(password.trim(), user.passwordHash);

    if (!isPasswordValid) {
      console.log('Contraseña no coincide');
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: user.id,
      correo: user.correoInstitucional,
      rol: user.rol,
    };

    // ✅ Token cambiado de 30m a 8h
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '8h',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        nombreCompleto: user.nombreCompleto,
        correoInstitucional: user.correoInstitucional,
        rol: user.rol,
      },
    };
  }

  async register(userData: any) {
    const { correoInstitucional, password, nombreCompleto, documentoIdentidad } = userData;

    const existingUser = await this.usersRepository.findOne({ 
      where: { correoInstitucional } 
    });
    
    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = this.usersRepository.create({
      nombreCompleto,
      documentoIdentidad,
      correoInstitucional: correoInstitucional.trim(),
      passwordHash: hashedPassword,
      rol: UserRole.ESTUDIANTE,
      estado: UserStatus.ACTIVO,
    });

    try {
      return await this.usersRepository.save(newUser);
    } catch (error) {
      console.error('Error de MySQL al registrar:', error);
      throw new BadRequestException('Error al guardar en la base de datos.');
    }
  }

  async validateUser(userId: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (user && user.estado === UserStatus.ACTIVO) {
      return user;
    }
    return null;
  }
}
