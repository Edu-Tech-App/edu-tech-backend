import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum StudyRoomStatus {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

@Entity('salas_estudio')
export class StudyRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'int' })
  capacidad: number;

  @Column({ type: 'varchar', length: 100 })
  ubicacion: string;

  @Column({
    type: 'enum',
    enum: StudyRoomStatus,
    default: StudyRoomStatus.ACTIVA,
  })
  estado: StudyRoomStatus;
}
