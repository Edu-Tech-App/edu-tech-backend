import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('docentes')
export class Teacher {
  @PrimaryColumn({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ length: 100 })
  especialidad: string;

  @Column({ length: 100 })
  departamento: string;

  @Column({ length: 20 })
  cubiculo: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user: User;
}
