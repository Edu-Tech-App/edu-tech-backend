import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('participantes_autorizados')
export class AuthorizedParticipant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre', length: 100 })
  nombre!: string;

  // Código numérico único de 6 dígitos. Nulo hasta que el administrador lo genera.
  @Column({ name: 'codigo', type: 'varchar', length: 6, unique: true, nullable: true })
  codigo!: string | null;

  // Queda en true cuando la persona valida su código por primera vez.
  // A partir de ahí queda registrada y no debe volver a digitar el código.
  @Column({ name: 'confirmado', type: 'boolean', default: false })
  confirmado!: boolean;

  @Column({ name: 'confirmado_en', type: 'datetime', nullable: true })
  confirmadoEn!: Date | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;
}
