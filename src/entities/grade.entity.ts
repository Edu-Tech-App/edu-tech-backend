import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Teacher } from './teacher.entity';
import { Subject } from './subject.entity';

@Entity('calificaciones')
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'estudiante_id' })
  estudianteId: number;

  @Column({ name: 'asignatura_id' })
  asignaturaId: number;

  @Column({ name: 'periodo_academico', length: 10 })
  periodoAcademico: string;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  valor: number;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @Column({ name: 'docente_id' })
  docenteId: number;

  @Column({
    name: 'valor_anterior',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
  })
  valorAnterior: number | null;

  @Column({ name: 'actualizado_por', type: 'int', nullable: true })
  actualizadoPor: number | null;

  // Relaciones
  @ManyToOne(() => Student)
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: Student;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'docente_id' })
  docente: Teacher;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'asignatura_id' })
  asignatura: Subject;
}
