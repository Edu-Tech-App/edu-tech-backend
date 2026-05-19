import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  MaxLength,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookCategory, BookStatus } from '../../entities/book.entity';

export class CreateBookDto {
  @ApiProperty({ example: 'Cien años de soledad', description: 'Título del libro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ example: 'Gabriel García Márquez', description: 'Autor del libro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  autor: string;

  @ApiProperty({
    example: BookCategory.INGENIERIA_SISTEMAS,
    enum: BookCategory,
    description: 'Categoría académica del libro según carrera o área institucional',
    required: false,
  })
  @IsEnum(BookCategory)
  @IsOptional()
  categoria?: BookCategory;

  @ApiProperty({ example: 'Editorial Sudamericana', description: 'Editorial del libro', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  editorial?: string;

  @ApiProperty({
    example: '/uploads/books/clean-code.jpg',
    description: 'Ruta pública de la portada del libro',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  portadaUrl?: string;

  @ApiProperty({ example: 5, description: 'Cantidad inicial disponible', required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  cantidadDisponible?: number;

  @ApiProperty({ 
    example: BookStatus.DISPONIBLE, 
    enum: BookStatus, 
    description: 'Estado inicial del libro',
    required: false 
  })
  @IsEnum(BookStatus)
  @IsOptional()
  estado?: BookStatus;
}
