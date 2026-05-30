import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { Fine, FineStatus } from '../entities/fine.entity';
import { Book, BookStatus } from '../entities/book.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { CreateLoanDto } from '../dto/loans/create-loan.dto';
import { UpdateLoanDto } from '../dto/loans/update-loan.dto';
import { NotificationsService } from './notifications.service';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Fine)
    private fineRepository: Repository<Fine>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private readonly notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  private async ensureStudentProfile(estudianteId: number): Promise<Student> {
    let estudiante = await this.studentRepository.findOneBy({ usuarioId: estudianteId });

    if (estudiante) {
      return estudiante;
    }

    const user = await this.userRepository.findOneBy({ id: estudianteId });

    if (!user || user.rol !== 'estudiante') {
      throw new NotFoundException(
        `El estudiante con ID ${estudianteId} no está registrado o no tiene el rol correspondiente`,
      );
    }

    estudiante = this.studentRepository.create({
      usuarioId: user.id,
      codigoEstudiantil: `EST-${user.id}`,
      carrera: 'Por definir',
      semestreActual: 1,
    });

    return this.studentRepository.save(estudiante);
  }

  async findByUser(estudianteId: number): Promise<Loan[]> {
    return this.loanRepository.find({
      where: { estudianteId },
      relations: ['libro', 'multa'],
      order: { fechaPrestamo: 'DESC' },
    });
  }

  async create(createLoanDto: CreateLoanDto): Promise<Loan> {
    const { libroId, estudianteId, fechaLimiteDevolucion } = createLoanDto;

    const libro = await this.bookRepository.findOneBy({ id: libroId });
    if (!libro) throw new NotFoundException(`Libro con ID ${libroId} no encontrado`);

    if (libro.cantidadDisponible <= 0 || libro.estado !== BookStatus.DISPONIBLE) {
      throw new BadRequestException('El libro no está disponible para préstamo');
    }

    await this.ensureStudentProfile(estudianteId);

    const multasPendientes = await this.fineRepository.createQueryBuilder('fine')
      .innerJoin('fine.prestamo', 'loan')
      .where('loan.estudianteId = :estudianteId', { estudianteId })
      .andWhere('fine.estado = :estado', { estado: FineStatus.PENDIENTE })
      .getCount();

    if (multasPendientes > 0) {
      throw new BadRequestException('El estudiante tiene multas pendientes y no puede realizar nuevos préstamos');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuevoPrestamo = this.loanRepository.create({
        libroId,
        estudianteId,
        fechaLimiteDevolucion: new Date(fechaLimiteDevolucion),
        estado: LoanStatus.ACTIVO,
      });

      const prestamoGuardado = await queryRunner.manager.save(nuevoPrestamo);
      libro.cantidadDisponible -= 1;
      await queryRunner.manager.save(libro);
      await queryRunner.commitTransaction();

      const user = await this.userRepository.findOne({ where: { id: estudianteId } });
      if (user && user.correoInstitucional) {
        this.notificationsService.sendLoanConfirmation(
          user.correoInstitucional,
          user.nombreCompleto,
          libro.titulo,
          nuevoPrestamo.fechaLimiteDevolucion,
        );
      }

      return prestamoGuardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Loan[]> {
    return this.loanRepository.find({
      relations: ['libro', 'estudiante', 'estudiante.user', 'multa'],
    });
  }

  async findByStudent(estudianteId: number, status?: LoanStatus, startDate?: string, endDate?: string): Promise<Loan[]> {
    const query = this.loanRepository.createQueryBuilder('loan')
      .leftJoinAndSelect('loan.libro', 'libro')
      .leftJoinAndSelect('loan.estudiante', 'estudiante')
      .leftJoinAndSelect('estudiante.user', 'user')
      .leftJoinAndSelect('loan.multa', 'multa')
      .where('loan.estudianteId = :estudianteId', { estudianteId });

    if (status) {
      query.andWhere('loan.estado = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('loan.fechaPrestamo BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate 
      });
    }

    query.orderBy('loan.fechaPrestamo', 'DESC');

    return query.getMany();
  }

  async findPendingFinesByUser(estudianteId: number): Promise<Fine[]> {
    return this.fineRepository.createQueryBuilder('fine')
      .innerJoinAndSelect('fine.prestamo', 'loan')
      .innerJoinAndSelect('loan.libro', 'libro')
      .where('loan.estudianteId = :estudianteId', { estudianteId })
      .andWhere('fine.estado = :estado', { estado: FineStatus.PENDIENTE })
      .getMany();
  }

  async findAllFines() {
    const fines = await this.fineRepository.find({
      relations: ['prestamo', 'prestamo.libro', 'prestamo.estudiante', 'prestamo.estudiante.user'],
    });

    const totalPendiente = fines
      .filter(f => f.estado === FineStatus.PENDIENTE)
      .reduce((sum, f) => sum + Number(f.monto), 0);

    const usuariosConMultas = new Set(
      fines
        .filter(f => f.estado === FineStatus.PENDIENTE)
        .map(f => f.prestamo?.estudianteId),
    ).size;

    return {
      fines,
      totalPendiente,
      usuariosConMultas,
    };
  }

  async findAllPayments(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['multa', 'multa.prestamo', 'multa.prestamo.libro', 'multa.prestamo.estudiante', 'multa.prestamo.estudiante.user'],
      order: { fechaPago: 'DESC' },
    });
  }

  async returnLoan(id: number): Promise<Loan> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prestamo = await queryRunner.manager.findOne(Loan, {
        where: { id },
        relations: ['libro'],
      });

      if (!prestamo) throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
      if (prestamo.estado === LoanStatus.DEVUELTO) throw new BadRequestException('El préstamo ya ha sido devuelto');

      prestamo.fechaDevolucionReal = new Date();
      prestamo.estado = LoanStatus.DEVUELTO;

      const fechaLimite = new Date(prestamo.fechaLimiteDevolucion);
      fechaLimite.setHours(0, 0, 0, 0);
      const fechaRealCopia = new Date(prestamo.fechaDevolucionReal);
      fechaRealCopia.setHours(0, 0, 0, 0);

      const diasRetraso = Math.ceil((fechaRealCopia.getTime() - fechaLimite.getTime()) / (1000 * 3600 * 24));

      if (diasRetraso > 0) {
        const nuevaMulta = queryRunner.manager.create(Fine, {
          prestamoId: prestamo.id,
          monto: diasRetraso * 1000,
          diasRetraso,
          estado: FineStatus.PENDIENTE,
        });
        await queryRunner.manager.save(nuevaMulta);
      }

      if (prestamo.libro) {
        prestamo.libro.cantidadDisponible += 1;
        await queryRunner.manager.save(prestamo.libro);
      }

      const prestamoActualizado = await queryRunner.manager.save(prestamo);
      await queryRunner.commitTransaction();

      const user = await this.userRepository.findOne({ where: { id: prestamo.estudianteId } });
      if (user && user.correoInstitucional && diasRetraso > 0) {
        this.notificationsService.sendFineNotification(
          user.correoInstitucional,
          user.nombreCompleto,
          prestamo.libro.titulo,
          diasRetraso * 1000,
          diasRetraso,
        );
      }

      return prestamoActualizado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateLoanDto: UpdateLoanDto): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: ['libro'],
    });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    if (updateLoanDto.libroId && updateLoanDto.libroId !== loan.libroId) {
      const book = await this.bookRepository.findOneBy({ id: updateLoanDto.libroId });
      if (!book) {
        throw new NotFoundException(`Libro con ID ${updateLoanDto.libroId} no encontrado`);
      }
      loan.libroId = updateLoanDto.libroId;
    }

    if (updateLoanDto.estudianteId) {
      await this.ensureStudentProfile(updateLoanDto.estudianteId);
      loan.estudianteId = updateLoanDto.estudianteId;
    }

    if (updateLoanDto.fechaLimiteDevolucion) {
      loan.fechaLimiteDevolucion = new Date(updateLoanDto.fechaLimiteDevolucion);
    }

    if (updateLoanDto.estado) {
      loan.estado = updateLoanDto.estado;
    }

    return this.loanRepository.save(loan);
  }

  async remove(id: number): Promise<void> {
    const loan = await this.loanRepository.findOneBy({ id });
    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }
    await this.loanRepository.remove(loan);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePendingPayments() {
    this.logger.log('Iniciando proceso de reintento para pagos PENDIENTES...');

    const pendingPayments = await this.paymentRepository.find({
      where: { estado: PaymentStatus.PENDIENTE },
      relations: ['multa'],
    });

    if (pendingPayments.length === 0) {
      this.logger.log('No hay pagos pendientes por procesar.');
      return;
    }

    for (const payment of pendingPayments) {
      const rand = Math.random();
      let newStatus: PaymentStatus;
      if (rand > 0.3) {
        newStatus = PaymentStatus.APROBADO;
      } else if (rand > 0.1) {
        newStatus = PaymentStatus.PENDIENTE;
      } else {
        newStatus = PaymentStatus.RECHAZADO;
      }

      if (newStatus !== PaymentStatus.PENDIENTE) {
        payment.estado = newStatus;
        await this.paymentRepository.save(payment);

        if (newStatus === PaymentStatus.APROBADO) {
          const multa = payment.multa;
          multa.estado = FineStatus.PAGADA;
          await this.fineRepository.save(multa);

          const loan = await this.loanRepository.findOne({
            where: { id: multa.prestamoId },
            relations: ['estudiante', 'estudiante.user', 'libro'],
          });

          if (loan?.estudiante?.user?.correoInstitucional) {
            this.notificationsService.sendPaymentConfirmation(
              loan.estudiante.user.correoInstitucional,
              loan.estudiante.user.nombreCompleto,
              multa.monto,
              `Multa por el libro: ${loan.libro.titulo} (Procesado automáticamente)`,
            ).catch(e => this.logger.error('Error enviando notificación:', e));
          }
          this.logger.log(`Pago para multa ${multa.id} APROBADO en reintento.`);
        } else {
          this.logger.log(`Pago para multa ${payment.multaId} RECHAZADO definitivamente en reintento.`);
        }
      }
    }
  }

  async payFine(multaId: number): Promise<Payment> {
    const multa = await this.fineRepository.findOneBy({ id: multaId });
    if (!multa) throw new NotFoundException(`Multa con ID ${multaId} no encontrada`);
    if (multa.estado !== FineStatus.PENDIENTE) throw new BadRequestException('La multa ya está pagada o anulada');

    // Nueva simulación: 60% aprobado, 20% pendiente, 20% rechazado
    const rand = Math.random();
    let paymentStatus: PaymentStatus;
    if (rand > 0.4) {
      paymentStatus = PaymentStatus.APROBADO;
    } else if (rand > 0.2) {
      paymentStatus = PaymentStatus.PENDIENTE;
    } else {
      paymentStatus = PaymentStatus.RECHAZADO;
    }

    const referenciaPasarela = 'REF-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = this.paymentRepository.create({
        multaId: multa.id,
        monto: multa.monto,
        referenciaPasarela,
        estado: paymentStatus,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      if (paymentStatus === PaymentStatus.APROBADO) {
        multa.estado = FineStatus.PAGADA;
        await queryRunner.manager.save(multa);

        const loan = await queryRunner.manager.findOne(Loan, {
          where: { id: multa.prestamoId },
          relations: ['estudiante', 'estudiante.user', 'libro'],
        });

        if (loan?.estudiante?.user?.correoInstitucional) {
          this.notificationsService.sendPaymentConfirmation(
            loan.estudiante.user.correoInstitucional,
            loan.estudiante.user.nombreCompleto,
            multa.monto,
            `Multa por el libro: ${loan.libro.titulo}`,
          ).catch(e => console.error('Error enviando notificación de pago:', e));
        }
      }

      await queryRunner.commitTransaction();

      if (paymentStatus === PaymentStatus.RECHAZADO) {
        throw new BadRequestException('El pago fue RECHAZADO por la pasarela simulada (Fondos insuficientes)');
      }

      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
