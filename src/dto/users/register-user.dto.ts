import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'Juan Perez', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  nombreCompleto: string;

  @ApiProperty({ example: '12345678', description: 'Documento de identidad' })
  @IsString()
  @IsNotEmpty()
  documentoIdentidad: string;

  @ApiProperty({ example: 'juan.perez@universidad.edu.co', description: 'Correo institucional único' })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    example: 'ESTUDIANTE', 
    enum: ['ESTUDIANTE', 'DOCENTE', 'BIBLIOTECARIO', 'ADMINISTRATIVO', 'SUPERVISOR'],
    description: 'Rol asignado al usuario' 
  })
  @IsEnum(['ESTUDIANTE', 'DOCENTE', 'BIBLIOTECARIO', 'ADMINISTRATIVO', 'SUPERVISOR'])
  rol: 'ESTUDIANTE' | 'DOCENTE' | 'BIBLIOTECARIO' | 'ADMINISTRATIVO' | 'SUPERVISOR';

  @ApiProperty({
    example: 'INGENIERIA_SISTEMAS',
    description: 'Carrera del estudiante, si aplica',
    required: false,
  })
  @IsOptional()
  @IsString()
  carrera?: string;
}
