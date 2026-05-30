import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudyRoomDto {
  @ApiProperty({
    example: 'Sala de Cómputo A',
    description: 'Nombre de la sala',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 10, description: 'Capacidad máxima de personas' })
  @IsInt()
  @Min(1)
  capacidad: number;

  @ApiProperty({
    example: 'Piso 2, Ala Norte',
    description: 'Ubicación física de la sala',
  })
  @IsString()
  @IsNotEmpty()
  ubicacion: string;
}
