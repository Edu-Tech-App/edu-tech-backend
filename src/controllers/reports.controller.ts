import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ReportsService } from '../services/reports.service';
import { ReportFilterDto, ReportFormat } from '../dto/reports/report-filter.dto';

@ApiTags('Reportes')
@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Generar reporte de calificaciones
   */
  @Get('calificaciones')
  @Roles(UserRole.ADMINISTRATIVO)
  @ApiOperation({
    summary: 'Generar reporte de calificaciones',
    description:
      'Genera un reporte de calificaciones por asignatura y período en formato PDF o Excel',
  })
  @ApiQuery({ name: 'startDate', type: String, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: String, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'format',
    type: String,
    enum: ['pdf', 'excel'],
    required: false,
    description: 'Formato del reporte (pdf o excel)',
  })
  @ApiQuery({
    name: 'periodoAcademico',
    type: String,
    required: false,
    description: 'Período académico (ej: 2024-I)',
  })
  @ApiQuery({ name: 'asignaturaId', type: Number, required: false, description: 'ID de la asignatura' })
  async generateGradesReport(
    @Query() query: any,
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      const filterDto: ReportFilterDto = {
        startDate: query.startDate,
        endDate: query.endDate,
        format: query.format === 'excel' ? ReportFormat.EXCEL : ReportFormat.PDF,
        periodoAcademico: query.periodoAcademico,
        asignaturaId: query.asignaturaId ? parseInt(query.asignaturaId) : undefined,
      };

      const buffer = await this.reportsService.generateGradesReport(filterDto, req.user.id);

      const fileName = `reporte-calificaciones-${new Date().getTime()}.${
        filterDto.format === ReportFormat.EXCEL ? 'xlsx' : 'pdf'
      }`;
      const mimeType =
        filterDto.format === ReportFormat.EXCEL ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', mimeType);
      res.send(buffer);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error generando el reporte',
      });
    }
  }

  /**
   * Generar reporte de préstamos, devoluciones y multas
   */
  @Get('prestamos')
  @Roles(UserRole.ADMINISTRATIVO)
  @ApiOperation({
    summary: 'Generar reporte de préstamos',
    description:
      'Genera un reporte de préstamos, devoluciones y multas por período en formato PDF o Excel',
  })
  @ApiQuery({ name: 'startDate', type: String, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: String, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'format',
    type: String,
    enum: ['pdf', 'excel'],
    required: false,
    description: 'Formato del reporte (pdf o excel)',
  })
  async generateLoansReport(
    @Query() query: any,
    @Res() res: Response,
    @Req() req: any,
  ) {
    try {
      const filterDto: ReportFilterDto = {
        startDate: query.startDate,
        endDate: query.endDate,
        format: query.format === 'excel' ? ReportFormat.EXCEL : ReportFormat.PDF,
      };

      const buffer = await this.reportsService.generateLoansReport(filterDto, req.user.id);

      const fileName = `reporte-prestamos-${new Date().getTime()}.${
        filterDto.format === ReportFormat.EXCEL ? 'xlsx' : 'pdf'
      }`;
      const mimeType =
        filterDto.format === ReportFormat.EXCEL ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', mimeType);
      res.send(buffer);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error generando el reporte',
      });
    }
  }
}
