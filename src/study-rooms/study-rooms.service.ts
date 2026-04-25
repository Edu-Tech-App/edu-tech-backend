import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyRoom, StudyRoomStatus } from './entities/study-room.entity';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

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

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar superposición de horarios
    const overlapping = await this.reservationRepository.createQueryBuilder('reserva')
      .where('reserva.sala_id = :salaId', { salaId })
      .andWhere('reserva.fecha_reserva = :fechaReserva', { fechaReserva })
      .andWhere('reserva.estado = :estado', { estado: ReservationStatus.ACTIVA })
      .andWhere(
        '((reserva.hora_inicio <= :horaInicio AND reserva.hora_fin > :horaInicio) OR (reserva.hora_inicio < :horaFin AND reserva.hora_fin >= :horaFin) OR (reserva.hora_inicio >= :horaInicio AND reserva.hora_fin <= :horaFin))',
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
    newReservation.fechaReserva = new Date(fechaReserva);
    newReservation.horaInicio = horaInicio;
    newReservation.horaFin = horaFin;
    newReservation.estado = ReservationStatus.ACTIVA;

    const savedReservation = await this.reservationRepository.save(newReservation);

    // Enviar notificación asíncrona
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
}
