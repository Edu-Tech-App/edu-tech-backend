import { IsString, IsNotEmpty, IsInt, Min, IsEnum, IsOptional, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookCategory } from '../../entities/book.entity';

export class CreateSubjectDto {
  @ApiProperty({ example: 'SIS-001', description: 'Código único de la asignatura', required: false })
  @IsString()
  @IsOptional()
  codigo?: string;

  @ApiProperty({ example: 'Cálculo Diferencial', description: 'Nombre de la asignatura' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    example: BookCategory.INGENIERIA_SISTEMAS,
    enum: BookCategory,
    description: 'Carrera o programa al que pertenece la asignatura',
  })
  @IsEnum(BookCategory)
  @IsNotEmpty()
  carrera: BookCategory;

  @ApiProperty({ example: 4, description: 'Semestre al que pertenece la asignatura' })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsNotEmpty()
  semestre: number;

  @ApiProperty({ example: 3, description: 'Cantidad de créditos académicos' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  creditos: number;

  @ApiProperty({ example: 1, description: 'ID del docente asignado', required: false })
  @IsInt()
  @IsOptional()
  docenteId?: number;
}
