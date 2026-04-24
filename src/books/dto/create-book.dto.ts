import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { BookStatus } from '../entities/book.entity';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  autor: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  categoria?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  editorial?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  cantidadDisponible?: number;

  @IsEnum(BookStatus)
  @IsOptional()
  estado?: BookStatus;
}
