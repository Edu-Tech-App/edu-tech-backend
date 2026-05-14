import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('estudiantes')
export class Student {
  @PrimaryColumn({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'codigo_estudiantil', length: 20 })
  codigoEstudiantil: string;

  @Column({ length: 100 })
  carrera: string;

  @Column({ name: 'semestre_actual' })
  semestreActual: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user: User;
}
