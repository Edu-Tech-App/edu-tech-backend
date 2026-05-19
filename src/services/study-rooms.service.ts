import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyRoom, StudyRoomStatus } from '../entities/study-room.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { User, UserRole } from '../entities/user.entity';
import { NotificationsService } from './notifications.service';
import { AdminCreateReservationDto } from '../dto/study-rooms/admin-create-reservation.dto';
import { AdminUpdateReservationDto } from '../dto/study-rooms/admin-update-reservation.dto';
import { UpdateStudyRoomDto } from '../dto/study-rooms/update-room.dto';

@Injectable()
export class StudyRoomsService {
  constructor(
    @InjectRepository(StudyRoom)
    private studyRoomRepository: Repository<StudyRoom>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async createRoom(nombre: string, capacidad: number, ubicacion: string): Promise<StudyRoom> {
    const newRoom = this.studyRoomRepository.create({
      nombre,
      capacidad,
      ubicacion,
      estado: StudyRoomStatus.ACTIVA,
    });
    return this.studyRoomRepository.save(newRoom);
  }

  async findAllRooms(): Promise<StudyRoom[]> {
    return this.studyRoomRepository.find({
      order: {
        nombre: 'ASC',
      },
    });
  }

  async updateRoom(id: number, updateRoomDto: UpdateStudyRoomDto): Promise<StudyRoom> {
    const room = await this.studyRoomRepository.findOneBy({ id });
    if (!room) {
      throw new NotFoundException('Sala no encontrada');
    }
    Object.assign(room, updateRoomDto);
    return this.studyRoomRepository.save(room);
  }

  async deleteRoom(id: number): Promise<void> {
    const room = await this.studyRoomRepository.findOneBy({ id });
    if (!room) {
      throw new NotFoundException('Sala no encontrada');
    }
    await this.studyRoomRepository.remove(room);
  }

  private parseReservationDate(fechaReserva: string) {
    const [year, month, day] = fechaReserva.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatReservationDate(date: Date | string) {
    if (date instanceof Date) {
      return date.toISOString().slice(0, 10);
    }

    return String(date).slice(0, 10);
  }

  private validateTimeRange(horaInicio: string, horaFin: string) {
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    const totalInicio = hInicio * 60 + mInicio;
    const totalFin = hFin * 60 + mFin;

    if (totalInicio >= totalFin) {
      throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  private validateReservationDateWindow(fechaReserva: string) {
    const fechaPropuesta = this.parseReservationDate(fechaReserva);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 7);

    if (fechaPropuesta > limite) {
      throw new BadRequestException('Solo se puede reservar con un máximo de 7 días de anticipación');
    }

    if (fechaPropuesta < hoy) {
      throw new BadRequestException('No se puede reservar en una fecha pasada');
    }
  }

  private async validateOverlappingReservation(
    salaId: number,
    fechaReserva: string,
    horaInicio: string,
    horaFin: string,
    excludeId?: number,
  ) {
    const query = this.reservationRepository.createQueryBuilder('reserva')
      .where('reserva.sala_id = :salaId', { salaId })
      .andWhere('CAST(reserva.fecha_reserva AS CHAR) = :fechaReserva', { fechaReserva })
      .andWhere('reserva.estado = :estado', { estado: ReservationStatus.ACTIVA })
      .andWhere('(reserva.hora_inicio < :horaFin AND reserva.hora_fin > :horaInicio)', {
        horaInicio,
        horaFin,
      });

    if (excludeId) {
      query.andWhere('reserva.id != :excludeId', { excludeId });
    }

    const overlapping = await query.getCount();

    if (overlapping > 0) {
      throw new BadRequestException('La sala ya está reservada en ese horario');
    }
  }

  private async validateRoomAndUser(salaId: number, userId: number) {
    const sala = await this.studyRoomRepository.findOneBy({ id: salaId });
    if (!sala || sala.estado !== StudyRoomStatus.ACTIVA) {
      throw new NotFoundException('Sala no encontrada o no está activa');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.rol !== UserRole.ESTUDIANTE && user.rol !== UserRole.DOCENTE) {
      throw new BadRequestException('Solo estudiantes y docentes pueden tener reservas de salas');
    }

    return { sala, user };
  }

  async findAllReservations(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['sala', 'estudiante', 'estudiante.user', 'docente', 'docente.user'],
      order: {
        fechaReserva: 'DESC',
        horaInicio: 'DESC',
      },
    });
  }

  async findReservationsByUser(userId: number): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: [
        { estudianteId: userId },
        { docenteId: userId },
      ],
      relations: ['sala', 'estudiante', 'estudiante.user', 'docente', 'docente.user'],
      order: {
        fechaReserva: 'DESC',
        horaInicio: 'DESC',
      },
    });
  }

  async createReservation(
    salaId: number,
    userId: number,
    isEstudiante: boolean,
    fechaReserva: string,
    horaInicio: string,
    horaFin: string,
  ): Promise<Reservation> {
    const { sala, user } = await this.validateRoomAndUser(salaId, userId);
    this.validateTimeRange(horaInicio, horaFin);
    this.validateReservationDateWindow(fechaReserva);

    // Validación: El usuario no puede tener otra reserva ACTIVA para esta misma sala
    const searchCriteria: any = {
      salaId,
      estado: ReservationStatus.ACTIVA,
    };

    if (isEstudiante) {
      searchCriteria.estudianteId = userId;
    } else {
      searchCriteria.docenteId = userId;
    }

    const userActiveRes = await this.reservationRepository.findOne({
      where: searchCriteria,
    });

    if (userActiveRes) {
      throw new BadRequestException('Ya tienes una reserva activa para esta sala. Debes usarla o cancelarla antes de hacer otra.');
    }

    await this.validateOverlappingReservation(salaId, fechaReserva, horaInicio, horaFin);

    const newReservation = new Reservation();
    newReservation.salaId = salaId;
    newReservation.estudianteId = isEstudiante ? userId : null;
    newReservation.docenteId = !isEstudiante ? userId : null;
    newReservation.fechaReserva = this.parseReservationDate(fechaReserva);
    newReservation.horaInicio = horaInicio;
    newReservation.horaFin = horaFin;
    newReservation.estado = ReservationStatus.ACTIVA;

    const savedReservation = await this.reservationRepository.save(newReservation);

    if (user.correoInstitucional) {
      this.notificationsService.sendReservationConfirmation(
        user.correoInstitucional,
        user.nombreCompleto,
        sala.nombre,
        savedReservation.fechaReserva,
        savedReservation.horaInicio,
        savedReservation.horaFin,
      ).catch(e => console.error(e));
    }

    return savedReservation;
  }

  async adminCreateReservation(createReservationDto: AdminCreateReservationDto): Promise<Reservation> {
    const { salaId, userId, fechaReserva, horaInicio, horaFin } = createReservationDto;
    const { user } = await this.validateRoomAndUser(salaId, userId);
    this.validateTimeRange(horaInicio, horaFin);
    this.validateReservationDateWindow(fechaReserva);
    await this.validateOverlappingReservation(salaId, fechaReserva, horaInicio, horaFin);

    const reservation = this.reservationRepository.create({
      salaId,
      estudianteId: user.rol === UserRole.ESTUDIANTE ? userId : null,
      docenteId: user.rol === UserRole.DOCENTE ? userId : null,
      fechaReserva: this.parseReservationDate(fechaReserva),
      horaInicio,
      horaFin,
      estado: createReservationDto.estado ?? ReservationStatus.ACTIVA,
    });

    return this.reservationRepository.save(reservation);
  }

  async adminUpdateReservation(id: number, updateReservationDto: AdminUpdateReservationDto): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOneBy({ id });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    const nextSalaId = updateReservationDto.salaId ?? reservation.salaId;
    const currentUserId = reservation.estudianteId ?? reservation.docenteId;
    const nextUserId = updateReservationDto.userId ?? currentUserId;
    const nextFechaReserva = updateReservationDto.fechaReserva ?? this.formatReservationDate(reservation.fechaReserva);
    const nextHoraInicio = updateReservationDto.horaInicio ?? reservation.horaInicio.slice(0, 5);
    const nextHoraFin = updateReservationDto.horaFin ?? reservation.horaFin.slice(0, 5);

    if (!nextUserId) {
      throw new BadRequestException('La reserva debe tener un usuario asociado');
    }

    const { user } = await this.validateRoomAndUser(nextSalaId, nextUserId);
    this.validateTimeRange(nextHoraInicio, nextHoraFin);
    this.validateReservationDateWindow(nextFechaReserva);

    if ((updateReservationDto.estado ?? reservation.estado) === ReservationStatus.ACTIVA) {
      await this.validateOverlappingReservation(nextSalaId, nextFechaReserva, nextHoraInicio, nextHoraFin, id);
    }

    reservation.salaId = nextSalaId;
    reservation.estudianteId = user.rol === UserRole.ESTUDIANTE ? nextUserId : null;
    reservation.docenteId = user.rol === UserRole.DOCENTE ? nextUserId : null;
    reservation.fechaReserva = this.parseReservationDate(nextFechaReserva);
    reservation.horaInicio = nextHoraInicio;
    reservation.horaFin = nextHoraFin;
    reservation.estado = updateReservationDto.estado ?? reservation.estado;

    return this.reservationRepository.save(reservation);
  }

  async cancelReservation(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['sala'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.estado !== ReservationStatus.ACTIVA) {
      throw new BadRequestException('Solo se pueden cancelar reservas activas');
    }

    // Validación: Falta más de 1 hora para el inicio
    const ahora = new Date();
    const fechaReserva = new Date(reservation.fechaReserva);
    const [horas, minutos] = reservation.horaInicio.split(':').map(Number);
    
    // Configurar la fecha y hora exacta de inicio de la reserva
    const fechaInicioCompleta = new Date(fechaReserva);
    fechaInicioCompleta.setHours(horas, minutos, 0, 0);

    const diferenciaMs = fechaInicioCompleta.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    if (diferenciaHoras < 1) {
      throw new BadRequestException('No se puede cancelar una reserva con menos de 1 hora de anticipación');
    }

    reservation.estado = ReservationStatus.CANCELADA;
    return this.reservationRepository.save(reservation);
  }

  async adminCancelReservation(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['sala', 'estudiante', 'estudiante.user', 'docente', 'docente.user'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.estado === ReservationStatus.CANCELADA) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    if (reservation.estado === ReservationStatus.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar una reserva completada');
    }

    reservation.estado = ReservationStatus.CANCELADA;
    return this.reservationRepository.save(reservation);
  }

  async adminDeleteReservation(id: number): Promise<void> {
    const reservation = await this.reservationRepository.findOneBy({ id });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    await this.reservationRepository.remove(reservation);
  }
}
