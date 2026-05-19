import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from './teacher.entity';
import { BookCategory } from './book.entity';

@Entity('asignaturas')
export class Subject {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 20, unique: true })
  codigo!: string;

  @Column({ length: 100 })
  nombre!: string;

  @Column({
    type: 'enum',
    enum: BookCategory,
  })
  carrera!: BookCategory;

  @Column()
  semestre!: number;

  @Column()
  creditos!: number;

  @Column({ name: 'docente_id', nullable: true })
  docenteId!: number | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'docente_id' })
  docente!: Teacher | null;
}
