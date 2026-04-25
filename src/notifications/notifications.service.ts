import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../loans/entities/loan.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringLoans() {
    this.logger.log('Iniciando revisión diaria de préstamos por vencer...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar préstamos activos cuya fecha límite sea mañana (por vencer) o que ya estén vencidos
    const expiringLoans = await this.loanRepository.createQueryBuilder('loan')
      .innerJoinAndSelect('loan.estudiante', 'estudiante')
      .innerJoinAndSelect('loan.libro', 'libro')
      .where('loan.estado = :estado', { estado: LoanStatus.ACTIVO })
      .andWhere('loan.fechaLimiteDevolucion <= :tomorrow', { tomorrow })
      .getMany();

    if (expiringLoans.length === 0) {
      this.logger.log('No hay préstamos por vencer hoy.');
      return;
    }

    for (const loan of expiringLoans) {
      if (loan.estudiante && loan.estudiante.correoInstitucional) {
        try {
          await this.mailerService.sendMail({
            to: loan.estudiante.correoInstitucional,
            subject: 'Recordatorio de devolución de libro',
            text: `Hola ${loan.estudiante.nombreCompleto}, te recordamos que el libro "${loan.libro.titulo}" vence el ${loan.fechaLimiteDevolucion}. Por favor devuélvelo a tiempo para evitar multas.`,
          });
          this.logger.log(`Correo enviado a ${loan.estudiante.correoInstitucional} por préstamo vencido/por vencer.`);
        } catch (error) {
          this.logger.error(`Error al enviar correo a ${loan.estudiante.correoInstitucional}:`, error);
        }
      }
    }
  }

  async sendReservationConfirmation(email: string, userName: string, roomName: string, date: Date, startTime: string, endTime: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Confirmación de Reserva de Sala',
        text: `Hola ${userName}, tu reserva para la sala "${roomName}" el día ${date} de ${startTime} a ${endTime} ha sido confirmada con éxito.`,
      });
      this.logger.log(`Correo de confirmación de reserva enviado a ${email}.`);
    } catch (error) {
      this.logger.error(`Error enviando correo de reserva a ${email}:`, error);
    }
  }
}
