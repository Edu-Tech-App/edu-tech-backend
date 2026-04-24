import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

  @Column({ name: 'valor_anterior', type: 'decimal', precision: 4, scale: 2, nullable: true })
  valorAnterior: number | null;

  @Column({ name: 'actualizado_por', nullable: true })
  actualizadoPor: number | null;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'docente_id' })
  docente: User;
}