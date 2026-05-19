import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../../entities/reservation.entity';

export class AdminUpdateReservationDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la sala' })
  @IsOptional()
  @IsInt()
  salaId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del usuario que reserva' })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ example: '2026-05-20', description: 'Fecha de la reserva' })
  @IsOptional()
  @IsDateString()
  fechaReserva?: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Hora de inicio (HH:mm)' })
  @IsOptional()
  @IsString()
  horaInicio?: string;

  @ApiPropertyOptional({ example: '10:00', description: 'Hora de fin (HH:mm)' })
  @IsOptional()
  @IsString()
  horaFin?: string;

  @ApiPropertyOptional({ enum: ReservationStatus, description: 'Estado de la reserva' })
  @IsOptional()
  @IsString()
  estado?: ReservationStatus;
}
