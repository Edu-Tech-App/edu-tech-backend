import { IsInt, IsNotEmpty, IsBoolean, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 1, description: 'ID de la sala' })
  @IsInt()
  @IsNotEmpty()
  salaId: number;

  @ApiProperty({ example: 1, description: 'ID del usuario que reserva, estudiante o docente' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: true, description: 'Indica si el usuario que reserva es estudiante. Para docente enviar false.' })
  @IsBoolean()
  isEstudiante: boolean;

  @ApiProperty({ example: '2026-06-15', description: 'Fecha de la reserva en formato YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  fechaReserva: string;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  horaInicio: string;

  @ApiProperty({ example: '10:00', description: 'Hora de fin (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  horaFin: string;
}
