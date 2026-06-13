import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAuthorizedDto {
  @ApiProperty({
    example: 'Laura Gomez',
    description: 'Nombre de la persona autorizada que el administrador agrega',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;
}
