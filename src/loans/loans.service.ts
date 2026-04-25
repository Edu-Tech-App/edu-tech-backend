import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { Fine, FineStatus } from './entities/fine.entity';
import { Book, BookStatus } from '../books/entities/book.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { CreateLoanDto } from './dto/create-loan.dto';

@Injectable()
export class LoansService {
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
    private dataSource: DataSource,
  ) {}

  async create(createLoanDto: CreateLoanDto): Promise<Loan> {
    const { libroId, estudianteId, fechaLimiteDevolucion } = createLoanDto;

    // 1. Validar que el libro existe y tiene stock
    const libro = await this.bookRepository.findOneBy({ id: libroId });
    if (!libro) {
      throw new NotFoundException(`Libro con ID ${libroId} no encontrado`);
    }

    if (libro.cantidadDisponible <= 0 || libro.estado !== BookStatus.DISPONIBLE) {
      throw new BadRequestException('El libro no está disponible para préstamo');
    }

    // 2. Validar que el usuario existe
    const usuario = await this.userRepository.findOneBy({ id: estudianteId });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${estudianteId} no encontrado`);
    }

    // 3. Validar que el usuario no tenga multas pendientes
    // Buscamos multas pendientes asociadas a préstamos del estudiante
    const multasPendientes = await this.fineRepository.createQueryBuilder('fine')
      .innerJoin('fine.prestamo', 'loan')
      .where('loan.estudianteId = :estudianteId', { estudianteId })
      .andWhere('fine.estado = :estado', { estado: FineStatus.PENDIENTE })
      .getCount();

    if (multasPendientes > 0) {
      throw new BadRequestException(
        'El estudiante tiene multas pendientes y no puede realizar nuevos préstamos',
      );
    }

    // 4. Registrar préstamo y actualizar stock (Transacción)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el préstamo
      const nuevoPrestamo = this.loanRepository.create({
        libroId,
        estudianteId,
        fechaLimiteDevolucion: new Date(fechaLimiteDevolucion),
        estado: LoanStatus.ACTIVO,
      });

      const prestamoGuardado = await queryRunner.manager.save(nuevoPrestamo);

      // Actualizar cantidad disponible del libro
      libro.cantidadDisponible -= 1;
      await queryRunner.manager.save(libro);

      await queryRunner.commitTransaction();
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
      relations: ['libro', 'estudiante', 'multa'],
    });
  }

  async findPendingFinesByUser(estudianteId: number): Promise<Fine[]> {
    return this.fineRepository.createQueryBuilder('fine')
      .innerJoinAndSelect('fine.prestamo', 'loan')
      .innerJoinAndSelect('loan.libro', 'libro')
      .where('loan.estudianteId = :estudianteId', { estudianteId })
      .andWhere('fine.estado = :estado', { estado: FineStatus.PENDIENTE })
      .getMany();
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

      if (!prestamo) {
        throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
      }

      if (prestamo.estado === LoanStatus.DEVUELTO) {
        throw new BadRequestException('El préstamo ya ha sido devuelto');
      }

      // Registrar fecha de devolución real
      prestamo.fechaDevolucionReal = new Date();
      prestamo.estado = LoanStatus.DEVUELTO;

      // Calcular días de retraso
      const fechaLimite = new Date(prestamo.fechaLimiteDevolucion);
      const fechaReal = prestamo.fechaDevolucionReal;
      
      // Asegurarse de comparar solo las fechas (sin horas)
      fechaLimite.setHours(0, 0, 0, 0);
      const fechaRealCopia = new Date(fechaReal);
      fechaRealCopia.setHours(0, 0, 0, 0);

      const diferenciaTiempo = fechaRealCopia.getTime() - fechaLimite.getTime();
      const diasRetraso = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

      // Generar multa si hay retraso
      if (diasRetraso > 0) {
        const montoMulta = diasRetraso * 1000; // $1,000 por día de retraso

        const nuevaMulta = queryRunner.manager.create(Fine, {
          prestamoId: prestamo.id,
          monto: montoMulta,
          diasRetraso: diasRetraso,
          estado: FineStatus.PENDIENTE,
        });

        await queryRunner.manager.save(nuevaMulta);
      }

      // Actualizar stock del libro
      if (prestamo.libro) {
        prestamo.libro.cantidadDisponible += 1;
        await queryRunner.manager.save(prestamo.libro);
      }

      // Guardar el préstamo actualizado
      const prestamoActualizado = await queryRunner.manager.save(prestamo);

      await queryRunner.commitTransaction();
      return prestamoActualizado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async payFine(multaId: number): Promise<Payment> {
    const multa = await this.fineRepository.findOneBy({ id: multaId });

    if (!multa) {
      throw new NotFoundException(`Multa con ID ${multaId} no encontrada`);
    }

    if (multa.estado !== FineStatus.PENDIENTE) {
      throw new BadRequestException('La multa ya está pagada o anulada');
    }

    // Simular respuesta de la pasarela de pagos
    const isApproved = Math.random() > 0.2; // 80% de probabilidad de éxito
    const referenciaPasarela = 'REF-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const paymentStatus = isApproved ? PaymentStatus.APROBADO : PaymentStatus.RECHAZADO;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = this.paymentRepository.create({
        multaId: multa.id,
        monto: multa.monto,
        referenciaPasarela: referenciaPasarela,
        estado: paymentStatus,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      if (isApproved) {
        multa.estado = FineStatus.PAGADA;
        await queryRunner.manager.save(multa);
      }

      await queryRunner.commitTransaction();

      if (!isApproved) {
        throw new BadRequestException('El pago fue RECHAZADO por la pasarela simulada');
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
