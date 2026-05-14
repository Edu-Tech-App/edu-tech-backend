import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  documentoIdentidad?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['ESTUDIANTE', 'DOCENTE', 'BIBLIOTECARIO', 'ADMINISTRATIVO'])
  rol?: 'ESTUDIANTE' | 'DOCENTE' | 'BIBLIOTECARIO' | 'ADMINISTRATIVO';
}

export class UpdateUserStatusDto {
  @IsEnum(['ACTIVO', 'BLOQUEADO', 'INACTIVO'])
  estado: 'ACTIVO' | 'BLOQUEADO' | 'INACTIVO';
}
