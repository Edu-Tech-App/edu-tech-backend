import { IsInt, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateLoanDto {
  @IsInt()
  @IsNotEmpty()
  libroId: number;

  @IsInt()
  @IsNotEmpty()
  estudianteId: number;

  @IsDateString()
  @IsNotEmpty()
  fechaLimiteDevolucion: string;
}
