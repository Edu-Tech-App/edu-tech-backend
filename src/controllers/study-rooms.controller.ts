import { Controller, Post, Body, UseGuards, Patch, Param, ParseIntPipe, Get, Put, Delete } from '@nestjs/common';
import { StudyRoomsService } from '../services/study-rooms.service';
import { CreateStudyRoomDto } from '../dto/study-rooms/create-room.dto';
import { CreateReservationDto } from '../dto/study-rooms/create-reservation.dto';
import { AdminCreateReservationDto } from '../dto/study-rooms/admin-create-reservation.dto';
import { AdminUpdateReservationDto } from '../dto/study-rooms/admin-update-reservation.dto';
import { UpdateStudyRoomDto } from '../dto/study-rooms/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('study-rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('study-rooms')
export class StudyRoomsController {
  constructor(private readonly studyRoomsService: StudyRoomsService) {}

  @Get()
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.BIBLIOTECARIO, UserRole.ESTUDIANTE, UserRole.DOCENTE)
  @ApiOperation({ summary: 'Obtener todas las salas de estudio' })
  findAllRooms() {
    return this.studyRoomsService.findAllRooms();
  }

  @Post()
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.BIBLIOTECARIO)
  @ApiOperation({ summary: 'Crear una nueva sala de estudio' })
  createRoom(@Body() createRoomDto: CreateStudyRoomDto) {
    return this.studyRoomsService.createRoom(
      createRoomDto.nombre,
      createRoomDto.capacidad,
      createRoomDto.ubicacion,
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.BIBLIOTECARIO)
  @ApiOperation({ summary: 'Actualizar una sala de estudio' })
  updateRoom(@Param('id', ParseIntPipe) id: number, @Body() updateRoomDto: UpdateStudyRoomDto) {
    return this.studyRoomsService.updateRoom(id, updateRoomDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.BIBLIOTECARIO)
  @ApiOperation({ summary: 'Eliminar una sala de estudio' })
  deleteRoom(@Param('id', ParseIntPipe) id: number) {
    return this.studyRoomsService.deleteRoom(id);
  }

  @Post('reservations')
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE)
  @ApiOperation({ summary: 'Crear una reserva de sala' })
  @ApiBody({
    type: CreateReservationDto,
    examples: {
      estudiante: {
        summary: 'Reserva hecha por estudiante',
        value: {
          salaId: 1,
          userId: 1,
          isEstudiante: true,
          fechaReserva: '2026-06-15',
          horaInicio: '08:00',
          horaFin: '10:00',
        },
      },
      docente: {
        summary: 'Reserva hecha por docente',
        value: {
          salaId: 1,
          userId: 2,
          isEstudiante: false,
          fechaReserva: '2026-06-15',
          horaInicio: '14:00',
          horaFin: '16:00',
        },
      },
    },
  })
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

  @Get('reservations')
  @Roles(UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.BIBLIOTECARIO)
  @ApiOperation({ summary: 'Listar todas las reservas de salas' })
  findAllReservations() {
    return this.studyRoomsService.findAllReservations();
  }

  @Get('reservations/user/:userId')
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE, UserRole.ADMINISTRATIVO, UserRole.SUPERVISOR, UserRole.BIBLIOTECARIO)
  @ApiOperation({ summary: 'Listar reservas de salas por usuario' })
  findReservationsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.studyRoomsService.findReservationsByUser(userId);
  }

  @Post('reservations/admin')
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Crear una reserva desde gestión operativa' })
  adminCreateReservation(@Body() createReservationDto: AdminCreateReservationDto) {
    return this.studyRoomsService.adminCreateReservation(createReservationDto);
  }

  @Put('reservations/:id')
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar una reserva desde gestión operativa' })
  adminUpdateReservation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservationDto: AdminUpdateReservationDto,
  ) {
    return this.studyRoomsService.adminUpdateReservation(id, updateReservationDto);
  }

  @Patch('reservations/:id/cancel')
  @Roles(UserRole.ESTUDIANTE, UserRole.DOCENTE)
  @ApiOperation({ summary: 'Cancelar una reserva (mínimo 1 hora antes)' })
  cancelReservation(@Param('id', ParseIntPipe) id: number) {
    return this.studyRoomsService.cancelReservation(id);
  }

  @Patch('reservations/:id/admin-cancel')
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Cancelar una reserva desde gestión operativa' })
  adminCancelReservation(@Param('id', ParseIntPipe) id: number) {
    return this.studyRoomsService.adminCancelReservation(id);
  }

  @Delete('reservations/:id')
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Eliminar una reserva desde gestión operativa' })
  adminDeleteReservation(@Param('id', ParseIntPipe) id: number) {
    return this.studyRoomsService.adminDeleteReservation(id);
  }
}
