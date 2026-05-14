import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  // Estilos CSS compartidos para todos los correos
  private readonly emailStyles = `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #007bff, #00d4ff); padding: 30px 20px; text-align: center; color: white; }
    .header.error { background: linear-gradient(135deg, #dc3545, #ff4d5a); }
    .header.success { background: linear-gradient(135deg, #28a745, #4cd137); }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; line-height: 1.6; color: #444; }
    .content h2 { color: #333; margin-top: 0; }
    .info-box { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .info-box.error { border-left-color: #dc3545; }
    .info-box.success { border-left-color: #28a745; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; }
  `;

  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async onModuleInit() {
    this.logger.log('Iniciando limpieza de reservas al arrancar el servidor...');
    await this.updateReservationStatuses();
  }

  private getTemplate(title: string, content: string, headerClass = ''): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${this.emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header ${headerClass}"><h1>${title}</h1></div>
          <div class="content">${content}</div>
          <div class="footer">
            <p>&copy; 2026 Edu-Tech - Sistema de Gestión Académica</p>
            <p>Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateReservationStatuses() {
    this.logger.log('Revisando reservas finalizadas para actualizar estado...');
    
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Buscar reservas activas que ya terminaron (de hoy o de días pasados)
    const pastReservations = await this.reservationRepository.createQueryBuilder('reserva')
      .where('reserva.estado = :estado', { estado: ReservationStatus.ACTIVA })
      .andWhere(
        '(CAST(reserva.fecha_reserva AS CHAR) < :hoy OR (CAST(reserva.fecha_reserva AS CHAR) = :hoy AND reserva.hora_fin <= :horaActual))',
        { hoy, horaActual }
      )
      .getMany();

    if (pastReservations.length > 0) {
      for (const res of pastReservations) {
        res.estado = ReservationStatus.COMPLETADA;
        await this.reservationRepository.save(res);
      }
      this.logger.log(`${pastReservations.length} reservas marcadas como COMPLETADAS.`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringLoans() {
    this.logger.log('Iniciando revisión diaria de préstamos por vencer...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringLoans = await this.loanRepository.createQueryBuilder('loan')
      .innerJoinAndSelect('loan.estudiante', 'estudiante')
      .innerJoinAndSelect('estudiante.user', 'user')
      .innerJoinAndSelect('loan.libro', 'libro')
      .where('loan.estado = :estado', { estado: LoanStatus.ACTIVO })
      .andWhere('loan.fechaLimiteDevolucion <= :tomorrow', { tomorrow })
      .getMany();

    for (const loan of expiringLoans) {
      if (loan.estudiante?.user?.correoInstitucional) {
        const content = `
          <h2>Hola, ${loan.estudiante.user.nombreCompleto}</h2>
          <p>Este es un recordatorio amistoso de que el plazo de devolución de tu libro está próximo a vencer.</p>
          <div class="info-box">
            <p><strong>Libro:</strong> ${loan.libro.titulo}</p>
            <p><strong>Fecha Límite:</strong> ${loan.fechaLimiteDevolucion.toLocaleDateString()}</p>
          </div>
          <p>Por favor, acércate a la biblioteca para devolverlo y evitar multas por retraso.</p>
        `;
        await this.sendEmail(loan.estudiante.user.correoInstitucional, 'Recordatorio de Devolución', content);
      }
    }
  }

  async sendReservationConfirmation(email: string, userName: string, roomName: string, date: Date, startTime: string, endTime: string) {
    const content = `
      <h2>Hola, ${userName}</h2>
      <p>Tu reserva de espacio ha sido confirmada con éxito. Aquí están los detalles:</p>
      <div class="info-box success">
        <p><strong>Sala:</strong> ${roomName}</p>
        <p><strong>Fecha:</strong> ${date.toLocaleDateString()}</p>
        <p><strong>Horario:</strong> ${startTime} - ${endTime}</p>
      </div>
      <p>Te recomendamos llegar 5 minutos antes. ¡Que tengas una productiva jornada de estudio!</p>
    `;
    await this.sendEmail(email, 'Confirmación de Reserva de Sala', content, 'success');
  }

  async sendGradeNotification(email: string, studentName: string, subjectName: string, grade: number, isUpdate = false) {
    const action = isUpdate ? 'actualizada' : 'registrada';
    const content = `
      <h2>Hola, ${studentName}</h2>
      <p>Se ha ${action} una nueva calificación en tu historial académico:</p>
      <div class="info-box">
        <p><strong>Asignatura:</strong> ${subjectName}</p>
        <p><strong>Calificación:</strong> <span style="font-size: 1.5em; color: #007bff; font-weight: bold;">${grade.toFixed(2)}</span></p>
      </div>
      <p>Puedes ver más detalles ingresando a tu portal estudiantil.</p>
    `;
    await this.sendEmail(email, `Nueva Calificación: ${subjectName}`, content);
  }

  async sendLoanConfirmation(email: string, studentName: string, bookTitle: string, dueDate: Date) {
    const content = `
      <h2>Hola, ${studentName}</h2>
      <p>Se ha registrado el préstamo del siguiente material bibliográfico:</p>
      <div class="info-box">
        <p><strong>Libro:</strong> ${bookTitle}</p>
        <p><strong>Fecha de Devolución:</strong> <span style="color: #dc3545; font-weight: bold;">${dueDate.toLocaleDateString()}</span></p>
      </div>
      <p>Por favor, cuida el material y devuélvelo antes de la fecha límite.</p>
    `;
    await this.sendEmail(email, 'Confirmación de Préstamo', content);
  }

  async sendFineNotification(email: string, studentName: string, bookTitle: string, fineAmount: number, daysLate: number) {
    const content = `
      <h2>Hola, ${studentName}</h2>
      <p>Se ha generado una multa debido a la devolución tardía de un material:</p>
      <div class="info-box error">
        <p><strong>Libro:</strong> ${bookTitle}</p>
        <p><strong>Días de Retraso:</strong> ${daysLate}</p>
        <p><strong>Monto Total:</strong> <span style="color: #dc3545; font-size: 1.3em; font-weight: bold;">$${fineAmount}</span></p>
      </div>
      <p>Para recuperar tus privilegios de préstamo, por favor realiza el pago correspondiente en la plataforma.</p>
    `;
    await this.sendEmail(email, 'Notificación de Multa', content, 'error');
  }

  async sendPaymentConfirmation(email: string, userName: string, amount: number, concept: string) {
    const content = `
      <h2>Hola, ${userName}</h2>
      <p>Hemos recibido tu pago correctamente. Aquí tienes el comprobante digital:</p>
      <div class="info-box success">
        <p><strong>Concepto:</strong> ${concept}</p>
        <p><strong>Monto Pagado:</strong> <span style="color: #28a745; font-size: 1.3em; font-weight: bold;">$${amount}</span></p>
        <p><strong>Fecha de Pago:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p>Tu cuenta ha sido actualizada. ¡Gracias por estar al día!</p>
    `;
    await this.sendEmail(email, 'Comprobante de Pago Recibido', content, 'success');
  }

  async sendWelcomeEmail(email: string, userName: string) {
    const content = `
      <h2>¡Bienvenido, ${userName}!</h2>
      <p>Es un gusto darte la bienvenida a <strong>Edu-Tech</strong>. Tu cuenta ha sido creada exitosamente.</p>
      <div class="info-box success">
        <p>Ya puedes acceder a gestionar tus materias, préstamos de libros y reservas de salas de estudio en un solo lugar.</p>
      </div>
      <p>¡Mucho éxito en tu camino de aprendizaje!</p>
    `;
    await this.sendEmail(email, 'Bienvenido a Edu-Tech', content, 'success');
  }

  private async sendEmail(to: string, title: string, content: string, headerClass = '') {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Edu-Tech: ${title}`,
        html: this.getTemplate(title, content, headerClass),
      });
      this.logger.log(`Correo '${title}' enviado a ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando correo '${title}' a ${to}:`, error);
    }
  }
}
