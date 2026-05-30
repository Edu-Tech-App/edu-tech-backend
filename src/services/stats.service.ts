import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Book } from '../entities/book.entity';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { Fine, FineStatus } from '../entities/fine.entity';
import { Subject } from '../entities/subject.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(Fine)
    private fineRepository: Repository<Fine>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  async getGeneralStats() {
    const totalUsuarios = await this.userRepository.count();
    const totalEstudiantes = await this.userRepository.count({ where: { rol: UserRole.ESTUDIANTE } });
    const totalDocentes = await this.userRepository.count({ where: { rol: UserRole.DOCENTE } });
    const totalBibliotecarios = await this.userRepository.count({ where: { rol: UserRole.BIBLIOTECARIO } });
    const totalAdministrativos = await this.userRepository.count({ where: { rol: UserRole.ADMINISTRATIVO } });
    const totalSupervisores = await this.userRepository.count({ where: { rol: UserRole.SUPERVISOR } });
    const totalLibros = await this.bookRepository.count();
    const prestamosActivos = await this.loanRepository.count({ where: { estado: LoanStatus.ACTIVO } });
    const totalMaterias = await this.subjectRepository.count();

    const multasPendientes = await this.fineRepository
      .createQueryBuilder('fine')
      .select('SUM(fine.monto)', 'total')
      .where('fine.estado = :estado', { estado: FineStatus.PENDIENTE })
      .getRawOne();

    // Préstamos del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const prestamosDelMes = await this.loanRepository
      .createQueryBuilder('loan')
      .where('loan.fechaPrestamo >= :fecha', { fecha: firstDayOfMonth })
      .getCount();

    // Libros más prestados
    const topLibros = await this.loanRepository
      .createQueryBuilder('loan')
      .select('loan.libroId', 'libroId')
      .addSelect('COUNT(loan.id)', 'totalPrestamos')
      .addSelect('libro.titulo', 'titulo')
      .innerJoin('loan.libro', 'libro')
      .groupBy('loan.libroId')
      .addGroupBy('libro.titulo')
      .orderBy('totalPrestamos', 'DESC')
      .limit(5)
      .getRawMany();

    // Libros por categoría
    const librosPorCategoria = await this.bookRepository
      .createQueryBuilder('book')
      .select('book.categoria', 'categoria')
      .addSelect('COUNT(book.id)', 'total')
      .groupBy('book.categoria')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalUsuarios,
      totalEstudiantes,
      totalDocentes,
      totalBibliotecarios,
      totalAdministrativos,
      totalSupervisores,
      totalLibros,
      prestamosActivos,
      totalMaterias,
      multasPendientes: Number(multasPendientes?.total || 0),
      prestamosDelMes,
      topLibros,
      librosPorCategoria,
    };
  }
}
