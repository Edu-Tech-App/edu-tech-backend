import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @IsNotEmpty()
  docenteId: number;
}
