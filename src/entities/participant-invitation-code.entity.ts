import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('codigos_invitacion_participantes')
export class ParticipantInvitationCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 6, unique: true })
  codigo!: string;

  @Column({ name: 'generado_por', type: 'varchar', length: 100, nullable: true })
  generadoPor!: string | null;

  @Column({ name: 'registrado_nombre', type: 'varchar', length: 100, nullable: true })
  registradoNombre!: string | null;

  @Column({ name: 'usado', type: 'boolean', default: false })
  usado!: boolean;

  @Column({ name: 'usado_en', type: 'datetime', nullable: true })
  usadoEn!: Date | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;
}
