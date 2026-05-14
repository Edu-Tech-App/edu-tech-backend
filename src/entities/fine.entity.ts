import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Loan } from './loan.entity';

export enum FineStatus {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  ANULADA = 'ANULADA',
}

@Entity('multas')
export class Fine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'prestamo_id' })
  prestamoId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'dias_retraso', default: 0 })
  diasRetraso: number;

  @Column({
    type: 'enum',
    enum: FineStatus,
    default: FineStatus.PENDIENTE,
  })
  estado: FineStatus;

  @Column({
    name: 'fecha_generacion',
    type: 'date',
    default: () => '(CURRENT_DATE)',
  })
  fechaGeneracion: Date;

  // Relaciones
  @OneToOne(() => Loan, (loan) => loan.multa)
  @JoinColumn({ name: 'prestamo_id' })
  prestamo: Loan;
}
