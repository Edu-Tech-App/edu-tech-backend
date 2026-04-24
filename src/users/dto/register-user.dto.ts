import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  nombreCompleto: string;

  @IsString()
  @IsNotEmpty()
  documentoIdentidad: string;

  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(['ESTUDIANTE', 'DOCENTE', 'BIBLIOTECARIO', 'ADMINISTRATIVO'])
  rol: 'ESTUDIANTE' | 'DOCENTE' | 'BIBLIOTECARIO' | 'ADMINISTRATIVO';
}