import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Grade } from '../entities/grade.entity';
import { Loan, LoanStatus } from '../entities/loan.entity';
import { Fine } from '../entities/fine.entity';
import { Book } from '../entities/book.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { ReportFilterDto, ReportFormat, ReportType } from '../dto/reports/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Grade)
    private gradesRepository: Repository<Grade>,
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
    @InjectRepository(Fine)
    private finesRepository: Repository<Fine>,
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  /**
   * Generar reporte de calificaciones
   */
  async generateGradesReport(
    filterDto: ReportFilterDto,
    userId: number,
  ): Promise<Buffer> {
    const { startDate, endDate, format, periodoAcademico, asignaturaId } = filterDto;

    // Validar fechas
    this.validateDates(startDate, endDate);

    // Obtener calificaciones con filtros
    const query = this.gradesRepository.createQueryBuilder('g').leftJoinAndSelect(
      User,
      'u',
      'u.id = g.estudianteId',
    );

    if (periodoAcademico) {
      query.andWhere('g.periodoAcademico = :periodoAcademico', { periodoAcademico });
    }

    if (asignaturaId) {
      query.andWhere('g.asignaturaId = :asignaturaId', { asignaturaId });
    }

    const grades = await query.getMany();

    if (grades.length === 0) {
      throw new BadRequestException('No hay calificaciones para el período especificado');
    }

    // Obtener información adicional
    const subjectsMap = new Map();
    const studentsMap = new Map();

    for (const grade of grades) {
      if (!subjectsMap.has(grade.asignaturaId)) {
        const subject = await this.subjectsRepository.findOne({
          where: { id: grade.asignaturaId },
        });
        if (subject) subjectsMap.set(grade.asignaturaId, subject.nombre);
      }

      if (!studentsMap.has(grade.estudianteId)) {
        const user = await this.usersRepository.findOne({
          where: { id: grade.estudianteId },
        });
        if (user) studentsMap.set(grade.estudianteId, user.nombreCompleto);
      }
    }

    if (format === ReportFormat.EXCEL) {
      return await this.generateGradesExcel(grades, subjectsMap, studentsMap);
    } else {
      return await this.generateGradesPDF(grades, subjectsMap, studentsMap, periodoAcademico);
    }
  }

  /**
   * Generar reporte de préstamos, devoluciones y multas
   */
  async generateLoansReport(filterDto: ReportFilterDto, userId: number): Promise<Buffer> {
    const { startDate, endDate, format } = filterDto;

    // Validar fechas
    this.validateDates(startDate, endDate);

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Obtener préstamos
    const loans = await this.loansRepository.find({
      where: {
        fechaPrestamo: Between(startDateObj, endDateObj),
      },
    });

    if (loans.length === 0) {
      throw new BadRequestException('No hay préstamos para el período especificado');
    }

    // Obtener información adicional
    const booksMap = new Map();
    const studentsMap = new Map();
    const finesMap = new Map();

    for (const loan of loans) {
      if (!booksMap.has(loan.libroId)) {
        const book = await this.booksRepository.findOne({
          where: { id: loan.libroId },
        });
        if (book) booksMap.set(loan.libroId, book.titulo);
      }

      if (!studentsMap.has(loan.estudianteId)) {
        const user = await this.usersRepository.findOne({
          where: { id: loan.estudianteId },
        });
        if (user) studentsMap.set(loan.estudianteId, user.nombreCompleto);
      }

      // Obtener multa asociada
      const fine = await this.finesRepository.findOne({
        where: { prestamoId: loan.id },
      });
      if (fine) {
        finesMap.set(loan.id, fine.monto);
      }
    }

    if (format === ReportFormat.EXCEL) {
      return await this.generateLoansExcel(loans, booksMap, studentsMap, finesMap);
    } else {
      return await this.generateLoansPDF(loans, booksMap, studentsMap, finesMap);
    }
  }

  /**
   * Generar Excel de calificaciones
   */
  private async generateGradesExcel(
    grades: Grade[],
    subjectsMap: Map<number, string>,
    studentsMap: Map<number, string>,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Calificaciones');

    // Configurar encabezados
    worksheet.columns = [
      { header: 'Estudiante', key: 'student', width: 25 },
      { header: 'Asignatura', key: 'subject', width: 25 },
      { header: 'Período', key: 'period', width: 12 },
      { header: 'Calificación', key: 'grade', width: 12 },
      { header: 'Fecha de Registro', key: 'date', width: 18 },
    ];

    // Agregar datos
    for (const grade of grades) {
      worksheet.addRow({
        student: studentsMap.get(grade.estudianteId) || 'N/A',
        subject: subjectsMap.get(grade.asignaturaId) || 'N/A',
        period: grade.periodoAcademico,
        grade: parseFloat(grade.valor.toString()).toFixed(2),
        date: new Date(grade.fechaRegistro).toLocaleDateString('es-ES'),
      });
    }

    // Estilo a los encabezados
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  /**
   * Generar PDF de calificaciones
   */
  private async generateGradesPDF(
    grades: Grade[],
    subjectsMap: Map<number, string>,
    studentsMap: Map<number, string>,
    period?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Título
      doc.fontSize(20).font('Helvetica-Bold').text('Reporte de Calificaciones', {
        align: 'center',
      });
      doc.fontSize(12).font('Helvetica').text(`Período: ${period || 'Múltiples'}`, {
        align: 'center',
      });
      doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`, {
        align: 'center',
      });
      doc.moveDown();

      // Tabla
      doc.fontSize(10);
      const startX = 50;
      const startY = 150;
      const rowHeight = 20;
      const colWidths = [150, 150, 80, 80];

      // Encabezados
      doc.font('Helvetica-Bold');
      const headers = ['Estudiante', 'Asignatura', 'Período', 'Calificación'];
      let currentX = startX;

      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], currentX, startY, { width: colWidths[i], align: 'left' });
        currentX += colWidths[i];
      }

      // Línea separadora
      doc.moveTo(startX, startY + 15).lineTo(startX + colWidths.reduce((a, b) => a + b), startY + 15).stroke();

      // Datos
      doc.font('Helvetica');
      let currentY = startY + 20;

      for (const grade of grades) {
        currentX = startX;
        const values = [
          studentsMap.get(grade.estudianteId) || 'N/A',
          subjectsMap.get(grade.asignaturaId) || 'N/A',
          grade.periodoAcademico,
          parseFloat(grade.valor.toString()).toFixed(2),
        ];

        for (let i = 0; i < values.length; i++) {
          doc.text(values[i], currentX, currentY, { width: colWidths[i], align: 'left' });
          currentX += colWidths[i];
        }

        currentY += rowHeight;

        // Agregar nueva página si es necesario
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }
      }

      doc.end();
    });
  }

  /**
   * Generar Excel de préstamos
   */
  private async generateLoansExcel(
    loans: Loan[],
    booksMap: Map<number, string>,
    studentsMap: Map<number, string>,
    finesMap: Map<number, number>,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Préstamos');

    worksheet.columns = [
      { header: 'Estudiante', key: 'student', width: 25 },
      { header: 'Libro', key: 'book', width: 25 },
      { header: 'Fecha Préstamo', key: 'loanDate', width: 15 },
      { header: 'Fecha Devolución Límite', key: 'dueDate', width: 15 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Multa (si aplica)', key: 'fine', width: 15 },
    ];

    for (const loan of loans) {
      const fine = finesMap.get(loan.id) || 0;
      worksheet.addRow({
        student: studentsMap.get(loan.estudianteId) || 'N/A',
        book: booksMap.get(loan.libroId) || 'N/A',
        loanDate: new Date(loan.fechaPrestamo).toLocaleDateString('es-ES'),
        dueDate: new Date(loan.fechaLimiteDevolucion).toLocaleDateString('es-ES'),
        status: loan.estado || 'N/A',
        fine: fine > 0 ? `$${fine.toFixed(2)}` : '-',
      });
    }

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  /**
   * Generar PDF de préstamos
   */
  private async generateLoansPDF(
    loans: Loan[],
    booksMap: Map<number, string>,
    studentsMap: Map<number, string>,
    finesMap: Map<number, number>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Título
      doc.fontSize(20).font('Helvetica-Bold').text('Reporte de Préstamos, Devoluciones y Multas', {
        align: 'center',
      });
      doc.fontSize(12).font('Helvetica').text(`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`, {
        align: 'center',
      });
      doc.moveDown();

      // Tabla
      doc.fontSize(10);
      const startX = 40;
      const startY = 120;
      const rowHeight = 18;
      const colWidths = [110, 110, 70, 70, 70, 80];

      // Encabezados
      doc.font('Helvetica-Bold');
      const headers = ['Estudiante', 'Libro', 'F. Préstamo', 'F. Devolución', 'Estado', 'Multa'];
      let currentX = startX;

      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], currentX, startY, { width: colWidths[i], align: 'left' });
        currentX += colWidths[i];
      }

      doc.moveTo(startX, startY + 12).lineTo(startX + colWidths.reduce((a, b) => a + b), startY + 12).stroke();

      // Datos
      doc.font('Helvetica');
      let currentY = startY + 16;

      for (const loan of loans) {
        currentX = startX;
        const fine = finesMap.get(loan.id) || 0;
        const fineText = fine > 0 ? `$${fine.toFixed(2)}` : '-';

        const values = [
          studentsMap.get(loan.estudianteId) || 'N/A',
          booksMap.get(loan.libroId) || 'N/A',
          new Date(loan.fechaPrestamo).toLocaleDateString('es-ES'),
          new Date(loan.fechaLimiteDevolucion).toLocaleDateString('es-ES'),
          loan.estado || 'N/A',
          fineText,
        ];

        for (let i = 0; i < values.length; i++) {
          doc.text(values[i], currentX, currentY, { width: colWidths[i], align: 'left' });
          currentX += colWidths[i];
        }

        currentY += rowHeight;

        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      }

      doc.end();
    });
  }

  /**
   * Validar rango de fechas
   */
  private validateDates(startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
      }

      if (start > end) {
        throw new BadRequestException('La fecha de inicio no puede ser mayor a la fecha de fin');
      }

      // Validar que no sea más de 12 meses
      const diffMonths =
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (diffMonths > 12) {
        throw new BadRequestException('El rango de fechas no puede exceder 12 meses');
      }
    } catch (error) {
      throw error;
    }
  }
}
