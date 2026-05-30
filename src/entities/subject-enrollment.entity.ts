import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Column,
} from 'typeorm';
import { Student } from './student.entity';
import { Subject } from './subject.entity';

@Entity('inscripciones_asignatura')
@Unique(['estudianteId', 'asignaturaId'])
export class SubjectEnrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'estudiante_id' })
  estudianteId!: number;

  @Column({ name: 'asignatura_id' })
  asignaturaId!: number;

  @CreateDateColumn({ name: 'fecha_inscripcion' })
  fechaInscripcion!: Date;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante!: Student;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignatura_id' })
  asignatura!: Subject;
}
