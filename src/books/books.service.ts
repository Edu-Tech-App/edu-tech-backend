import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const book = this.bookRepository.create(createBookDto);
    return await this.bookRepository.save(book);
  }

  async findAll(filters: {
    titulo?: string;
    autor?: string;
    categoria?: string;
  }): Promise<Book[]> {
    const where: any = {};

    if (filters.titulo) {
      where.titulo = Like(`%${filters.titulo}%`);
    }
    if (filters.autor) {
      where.autor = Like(`%${filters.autor}%`);
    }
    if (filters.categoria) {
      where.categoria = Like(`%${filters.categoria}%`);
    }

    return await this.bookRepository.find({ where });
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Libro con ID ${id} no encontrado`);
    }
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    this.bookRepository.merge(book, updateBookDto);
    return await this.bookRepository.save(book);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);

    // Validación: No se pueden eliminar libros con préstamos activos o vencidos
    // Usamos QueryBuilder para mantener la abstracción del ORM y la seguridad
    const activeLoansCount = await this.dataSource
      .getRepository('prestamos')
      .createQueryBuilder('prestamo')
      .where('prestamo.libro_id = :id', { id })
      .andWhere('prestamo.estado IN (:...estados)', {
        estados: ['ACTIVO', 'VENCIDO'],
      })
      .getCount();

    if (activeLoansCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el libro porque tiene préstamos activos o vencidos pendientes',
      );
    }

    await this.bookRepository.remove(book);
  }
}
