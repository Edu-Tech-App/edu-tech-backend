import { IsInt, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({
    example: 1,
    description: 'ID del libro que se solicita en prestamo',
  })
  @IsInt()
  @IsNotEmpty()
  libroId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario solicitante. Puede ser estudiante o docente; se conserva el nombre estudianteId por compatibilidad con la base de datos.',
  })
  @IsInt()
  @IsNotEmpty()
  estudianteId: number;

  @ApiProperty({
    example: '2026-06-15',
    description: 'Fecha pactada para la devolucion en formato YYYY-MM-DD',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaLimiteDevolucion: string;
}
