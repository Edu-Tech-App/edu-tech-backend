import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum BookStatus {
  DISPONIBLE = 'DISPONIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  BAJA = 'BAJA',
}

@Entity('libros')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  titulo: string;

  @Column({ length: 200 })
  autor: string;

  @Column({ length: 50, nullable: true })
  categoria: string;

  @Column({ length: 100, nullable: true })
  editorial: string;

  @Column({ name: 'cantidad_disponible', default: 0 })
  cantidadDisponible: number;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.DISPONIBLE,
  })
  estado: BookStatus;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
