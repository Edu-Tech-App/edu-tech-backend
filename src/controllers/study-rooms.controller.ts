import { Controller, Post, Body, UseGuards, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { StudyRoomsService } from '../services/study-rooms.service';
import { CreateStudyRoomDto } from '../dto/study-rooms/create-room.dto';
import { CreateReservationDto } from '../dto/study-rooms/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('study-rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('study-rooms')
export class StudyRoomsController {
  constructor(private readonly studyRoomsService: StudyRoomsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATIVO, UserRole.BIBLIOTECARIO)
  @ApiOperation({ summary: 'Crear una nueva sala de estudio' })
  createRoom(@Body() createRoomDto: CreateStudyRoomDto) {
    return this.studyRoomsService.createRoom(
      createRoomDto.nombre,
      createRoomDto.capacidad,
      createRoomDto.ubicacion,
    );
  }

  @Post('reservations')
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE)
  @ApiOperation({ summary: 'Crear una reserva de sala' })
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

  @Patch('reservations/:id/cancel')
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE)
  @ApiOperation({ summary: 'Cancelar una reserva (mínimo 1 hora antes)' })
  cancelReservation(@Param('id', ParseIntPipe) id: number) {
    return this.studyRoomsService.cancelReservation(id);
  }
}
