import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from './subject.entity';
import { User } from './user.entity';

@Entity('tareas_asignatura')
export class SubjectTask {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'asignatura_id' })
  asignaturaId!: number;

  @Column({ length: 150 })
  titulo!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ name: 'archivo_url', type: 'varchar', length: 255, nullable: true })
  archivoUrl!: string | null;

  @Column({ name: 'creado_por_id' })
  creadoPorId!: number;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignatura_id' })
  asignatura!: Subject;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor!: User;
}
