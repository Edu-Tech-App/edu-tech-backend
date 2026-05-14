import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'Juan Modificado', required: false })
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @ApiProperty({ example: '87654321', required: false })
  @IsOptional()
  @IsString()
  documentoIdentidad?: string;

  @ApiProperty({ example: 'juan.mod@universidad.edu.co', required: false })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiProperty({ example: 'NewPass123!', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ 
    example: 'DOCENTE', 
    enum: ['ESTUDIANTE', 'DOCENTE', 'BIBLIOTECARIO', 'ADMINISTRATIVO'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['ESTUDIANTE', 'DOCENTE', 'BIBLIOTECARIO', 'ADMINISTRATIVO'])
  rol?: 'ESTUDIANTE' | 'DOCENTE' | 'BIBLIOTECARIO' | 'ADMINISTRATIVO';
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: 'ACTIVO', enum: ['ACTIVO', 'BLOQUEADO', 'INACTIVO'] })
  @IsEnum(['ACTIVO', 'BLOQUEADO', 'INACTIVO'])
  estado: 'ACTIVO' | 'BLOQUEADO' | 'INACTIVO';
}
