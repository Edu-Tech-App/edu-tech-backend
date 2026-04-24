import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ESTUDIANTE = 'ESTUDIANTE',
  DOCENTE = 'DOCENTE',
  BIBLIOTECARIO = 'BIBLIOTECARIO',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
}

export enum UserStatus {
  ACTIVO = 'ACTIVO',
  BLOQUEADO = 'BLOQUEADO',
  INACTIVO = 'INACTIVO',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre_completo', length: 100 })
  nombreCompleto: string;

  @Column({ name: 'documento_identidad', length: 20, unique: true })
  documentoIdentidad: string;

  @Column({ name: 'correo_institucional', length: 100, unique: true })
  correoInstitucional: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
  rol: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVO })
  estado: UserStatus;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}