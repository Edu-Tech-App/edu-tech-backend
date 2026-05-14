import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyRoom, StudyRoomStatus } from '../entities/study-room.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from './notifications.service';

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

  async createReservation(
    salaId: number,
    userId: number,
    isEstudiante: boolean,
    fechaReserva: string,
    horaInicio: string,
    horaFin: string,
  ): Promise<Reservation> {
    const sala = await this.studyRoomRepository.findOneBy({ id: salaId });
    if (!sala || sala.estado !== StudyRoomStatus.ACTIVA) {
      throw new NotFoundException('Sala no encontrada o no está activa');
    }

    // Validación: hora_fin > hora_inicio (Convertir a minutos para seguridad)
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    const totalInicio = hInicio * 60 + mInicio;
    const totalFin = hFin * 60 + mFin;

    if (totalInicio >= totalFin) {
      throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
    }

    // Validación: Máximo 7 días de anticipación
    const [year, month, day] = fechaReserva.split('-').map(Number);
    const fechaPropuesta = new Date(year, month - 1, day); // Crear en hora local
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

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

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

    const overlapping = await this.reservationRepository.createQueryBuilder('reserva')
      .where('reserva.sala_id = :salaId', { salaId })
      .andWhere('CAST(reserva.fecha_reserva AS CHAR) = :fechaReserva', { fechaReserva })
      .andWhere('reserva.estado = :estado', { estado: ReservationStatus.ACTIVA })
      .andWhere(
        '(reserva.hora_inicio < :horaFin AND reserva.hora_fin > :horaInicio)',
        { horaInicio, horaFin }
      )
      .getCount();

    if (overlapping > 0) {
      throw new BadRequestException('La sala ya está reservada en ese horario');
    }

    const newReservation = new Reservation();
    newReservation.salaId = salaId;
    newReservation.estudianteId = isEstudiante ? userId : null;
    newReservation.docenteId = !isEstudiante ? userId : null;
    const [y, m, d] = fechaReserva.split('-').map(Number);
    newReservation.fechaReserva = new Date(y, m - 1, d);
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
}
