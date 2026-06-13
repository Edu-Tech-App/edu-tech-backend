import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateCodeDto {
  @ApiProperty({
    example: 'Tatiana Diaz',
    description: 'Nombre del usuario autorizado al que se le generará el código',
  })
  @IsString()
  @IsNotEmpty()
  nombre!: string;
}
