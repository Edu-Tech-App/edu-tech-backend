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

export enum BookCategory {
  INGENIERIA_SISTEMAS = 'INGENIERIA_SISTEMAS',
  INGENIERIA_CIVIL = 'INGENIERIA_CIVIL',
  INGENIERIA_INDUSTRIAL = 'INGENIERIA_INDUSTRIAL',
  ADMINISTRACION = 'ADMINISTRACION',
  CONTADURIA = 'CONTADURIA',
  ECONOMIA = 'ECONOMIA',
  DERECHO = 'DERECHO',
  MEDICINA = 'MEDICINA',
  ENFERMERIA = 'ENFERMERIA',
  PSICOLOGIA = 'PSICOLOGIA',
  EDUCACION = 'EDUCACION',
  MATEMATICAS = 'MATEMATICAS',
}

@Entity('libros')
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  titulo!: string;

  @Column({ length: 200 })
  autor!: string;

  @Column({
    type: 'enum',
    enum: BookCategory,
    nullable: true,
  })
  categoria!: BookCategory | null;

  @Column({ length: 100, nullable: true })
  editorial!: string;

  @Column({ name: 'portada_url', type: 'varchar', length: 255, nullable: true })
  portadaUrl!: string | null;

  @Column({ name: 'cantidad_disponible', default: 0 })
  cantidadDisponible!: number;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.DISPONIBLE,
  })
  estado!: BookStatus;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;
}
