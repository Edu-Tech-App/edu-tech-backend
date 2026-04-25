import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StudyRoom } from './study-room.entity';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../users/entities/student.entity';
import { Teacher } from '../../users/entities/teacher.entity';

export enum ReservationStatus {
  ACTIVA = 'ACTIVA',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

@Entity('reservas_salas')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sala_id', type: 'int' })
  salaId: number;

  @Column({ name: 'estudiante_id', type: 'int', nullable: true })
  estudianteId: number | null;

  @Column({ name: 'docente_id', type: 'int', nullable: true })
  docenteId: number | null;

  @Column({ name: 'fecha_reserva', type: 'date' })
  fechaReserva: Date;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVA,
  })
  estado: ReservationStatus;

  @ManyToOne(() => StudyRoom)
  @JoinColumn({ name: 'sala_id' })
  sala: StudyRoom;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: Student;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'docente_id' })
  docente: Teacher;
}
