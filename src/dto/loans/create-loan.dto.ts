import { IsInt, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({ example: 1, description: 'ID del libro a prestar' })
  @IsInt()
  @IsNotEmpty()
  libroId: number;

  @ApiProperty({ example: 1, description: 'ID del estudiante (usuario)' })
  @IsInt()
  @IsNotEmpty()
  estudianteId: number;

  @ApiProperty({ example: '2026-05-30', description: 'Fecha pactada para la devolución' })
  @IsDateString()
  @IsNotEmpty()
  fechaLimiteDevolucion: string;
}
