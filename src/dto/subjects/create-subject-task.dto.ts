import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubjectTaskDto {
  @ApiProperty({ example: 'Taller 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @ApiProperty({ example: 'Resolver los ejercicios del capítulo 1.' })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;
}

export class SubmitSubjectTaskDto {
  @ApiProperty({ example: 'Adjunto mi entrega final.', required: false })
  @IsOptional()
  @IsString()
  mensaje?: string;
}
