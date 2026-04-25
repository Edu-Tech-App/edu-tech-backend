import { Controller, Post, Body } from '@nestjs/common';
import { StudyRoomsService } from './study-rooms.service';

@Controller('study-rooms')
export class StudyRoomsController {
  constructor(private readonly studyRoomsService: StudyRoomsService) {}

  @Post()
  createRoom(@Body() createRoomDto: { nombre: string; capacidad: number; ubicacion: string }) {
    return this.studyRoomsService.createRoom(
      createRoomDto.nombre,
      createRoomDto.capacidad,
      createRoomDto.ubicacion,
    );
  }

  @Post('reservations')
  createReservation(
    @Body()
    createReservationDto: {
      salaId: number;
      userId: number;
      isEstudiante: boolean;
      fechaReserva: string;
      horaInicio: string;
      horaFin: string;
    },
  ) {
    return this.studyRoomsService.createReservation(
      createReservationDto.salaId,
      createReservationDto.userId,
      createReservationDto.isEstudiante,
      createReservationDto.fechaReserva,
      createReservationDto.horaInicio,
      createReservationDto.horaFin,
    );
  }
}
