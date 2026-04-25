import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Teacher } from '../../users/entities/teacher.entity';

@Entity('asignaturas')
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  codigo: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ name: 'docente_id' })
  docenteId: number;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'docente_id' })
  docente: Teacher;
}
