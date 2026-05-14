import { IsInt, IsNotEmpty, IsBoolean, IsDateString, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  @IsNotEmpty()
  salaId: number;

  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsBoolean()
  isEstudiante: boolean;

  @IsDateString()
  @IsNotEmpty()
  fechaReserva: string;

  @IsString()
  @IsNotEmpty()
  horaInicio: string;

  @IsString()
  @IsNotEmpty()
  horaFin: string;
}
