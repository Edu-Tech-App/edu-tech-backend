import { IsInt, IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateGradeDto {
  @IsInt()
  @IsNotEmpty()
  estudianteId: number;

  @IsInt()
  @IsNotEmpty()
  asignaturaId: number;

  @IsString()
  @IsNotEmpty()
  periodoAcademico: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  valor: number;
}

export class UpdateGradeDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  valor: number;
}