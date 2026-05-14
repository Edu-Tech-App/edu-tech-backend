import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../entities/user.entity';
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

    const user = await this.usersRepository.findOne({
      where: { correoInstitucional: correo },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (user.estado !== UserStatus.ACTIVO) {
      throw new UnauthorizedException('Usuario inactivo o bloqueado');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: user.id,
      correo: user.correoInstitucional,
      rol: user.rol,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '30m',
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

  async validateUser(userId: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
    });
  }
}
