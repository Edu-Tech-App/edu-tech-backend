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
}
