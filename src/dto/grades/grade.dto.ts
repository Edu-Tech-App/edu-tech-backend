import { IsInt, IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGradeDto {
  @ApiProperty({ example: 1, description: 'ID del estudiante' })
  @IsInt()
  @IsNotEmpty()
  estudianteId: number;

  @ApiProperty({ example: 1, description: 'ID de la asignatura' })
  @IsInt()
  @IsNotEmpty()
  asignaturaId: number;

  @ApiProperty({ example: '2026-1', description: 'Periodo académico' })
  @IsString()
  @IsNotEmpty()
  periodoAcademico: string;

  @ApiProperty({ example: 4.5, description: 'Valor de la nota (0-5)' })
  @IsNumber()
  @Min(0)
  @Max(5)
  valor: number;
}

export class UpdateGradeDto {
  @ApiProperty({ example: 4.8, description: 'Nuevo valor de la nota' })
  @IsNumber()
  @Min(0)
  @Max(5)
  valor: number;
}
