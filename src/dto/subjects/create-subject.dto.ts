import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ example: 'MAT-101', description: 'Código único de la asignatura' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Cálculo Diferencial', description: 'Nombre de la asignatura' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 1, description: 'ID del docente asignado' })
  @IsInt()
  @IsNotEmpty()
  docenteId: number;
}
