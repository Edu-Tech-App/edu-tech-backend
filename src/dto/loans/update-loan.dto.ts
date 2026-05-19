import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { LoanStatus } from '../../entities/loan.entity';

export class UpdateLoanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  libroId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  estudianteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaLimiteDevolucion?: string;

  @ApiPropertyOptional({ enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  estado?: LoanStatus;
}
