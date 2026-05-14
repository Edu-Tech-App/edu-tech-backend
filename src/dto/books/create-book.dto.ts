import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookStatus } from '../../entities/book.entity';

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

  @ApiProperty({ example: 'Novela', description: 'Categoría o género', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  categoria?: string;

  @ApiProperty({ example: 'Editorial Sudamericana', description: 'Editorial del libro', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  editorial?: string;

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
