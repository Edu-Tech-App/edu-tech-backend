import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../../entities/reservation.entity';

export class AdminCreateReservationDto {
  @ApiProperty({ example: 1, description: 'ID de la sala' })
  @IsInt()
  @IsNotEmpty()
  salaId!: number;

  @ApiProperty({ example: 1, description: 'ID del usuario que reserva' })
  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ example: '2026-05-20', description: 'Fecha de la reserva' })
  @IsDateString()
  @IsNotEmpty()
  fechaReserva!: string;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  horaInicio!: string;

  @ApiProperty({ example: '10:00', description: 'Hora de fin (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  horaFin!: string;

  @ApiPropertyOptional({ enum: ReservationStatus, description: 'Estado de la reserva' })
  @IsOptional()
  @IsString()
  estado?: ReservationStatus;
}
