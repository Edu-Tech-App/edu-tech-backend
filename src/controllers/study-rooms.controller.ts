import { Controller, Post, Body } from '@nestjs/common';
import { StudyRoomsService } from '../services/study-rooms.service';
import { CreateStudyRoomDto } from '../dto/study-rooms/create-room.dto';
import { CreateReservationDto } from '../dto/study-rooms/create-reservation.dto';

@Controller('study-rooms')
export class StudyRoomsController {
  constructor(private readonly studyRoomsService: StudyRoomsService) {}

  @Post()
  createRoom(@Body() createRoomDto: CreateStudyRoomDto) {
    return this.studyRoomsService.createRoom(
      createRoomDto.nombre,
      createRoomDto.capacidad,
      createRoomDto.ubicacion,
    );
  }

  @Post('reservations')
  createReservation(@Body() createReservationDto: CreateReservationDto) {
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
