import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { User } from '../../users/entities/user.entity';
import { Fine } from './fine.entity';

export enum LoanStatus {
  ACTIVO = 'ACTIVO',
  DEVUELTO = 'DEVUELTO',
  VENCIDO = 'VENCIDO',
  PERDIDO = 'PERDIDO',
}

@Entity('prestamos')
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'libro_id' })
  libroId: number;

  @Column({ name: 'estudiante_id' })
  estudianteId: number;

  @Column({
    name: 'fecha_prestamo',
    type: 'date',
    default: () => '(CURRENT_DATE)',
  })
  fechaPrestamo: Date;

  @Column({ name: 'fecha_limite_devolucion', type: 'date' })
  fechaLimiteDevolucion: Date;

  @Column({ name: 'fecha_devolucion_real', type: 'date', nullable: true })
  fechaDevolucionReal: Date;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.ACTIVO,
  })
  estado: LoanStatus;

  // Relaciones
  @ManyToOne(() => Book)
  @JoinColumn({ name: 'libro_id' })
  libro: Book;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: User;

  @OneToOne(() => Fine, (fine) => fine.prestamo)
  multa: Fine;
}
