import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Student } from './student.entity';
import { SubjectTask } from './subject-task.entity';

@Entity('entregas_tarea_asignatura')
@Unique(['tareaId', 'estudianteId'])
export class SubjectTaskSubmission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tarea_id' })
  tareaId!: number;

  @Column({ name: 'estudiante_id' })
  estudianteId!: number;

  @Column({ type: 'text', nullable: true })
  mensaje!: string | null;

  @Column({ name: 'archivo_url', type: 'varchar', length: 255, nullable: true })
  archivoUrl!: string | null;

  @CreateDateColumn({ name: 'entregado_en' })
  entregadoEn!: Date;

  @ManyToOne(() => SubjectTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tarea_id' })
  tarea!: SubjectTask;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante!: Student;
}
