import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum ReportType {
  GRADES = 'grades',
  LOANS = 'loans',
}

export class ReportFilterDto {
  @IsString()
  startDate: string; // Formato: YYYY-MM-DD

  @IsString()
  endDate: string; // Formato: YYYY-MM-DD

  @IsEnum(ReportFormat)
  @IsOptional()
  format: ReportFormat = ReportFormat.PDF;

  @IsOptional()
  @IsString()
  periodoAcademico?: string; // Ej: "2024-I"

  @IsOptional()
  asignaturaId?: number;

  @IsOptional()
  estudianteId?: number;
}

export class ReportResponseDto {
  success: boolean;
  message: string;
  fileName: string;
  size: number;
  mimeType: string;
}
