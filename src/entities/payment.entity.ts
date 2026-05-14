import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Fine } from './fine.entity';

export enum PaymentStatus {
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity('pagos_multas')
export class Payment {
  @PrimaryColumn({ name: 'multa_id', type: 'int' })
  multaId: number;

  @Column({ name: 'referencia_pasarela', type: 'varchar', length: 100 })
  referenciaPasarela: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  estado: PaymentStatus;

  @Column({
    name: 'fecha_pago',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaPago: Date;

  @OneToOne(() => Fine)
  @JoinColumn({ name: 'multa_id' })
  multa: Fine;
}
