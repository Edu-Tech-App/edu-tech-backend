import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator';

export class AccessParticipantDto {
  @ApiProperty({
    example: 'Tatiana Diaz',
    description: 'Nombre de la persona que intenta entrar',
  })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({
    example: '482910',
    description: 'Código de 6 dígitos asignado a la persona autorizada',
  })
  @IsNumberString()
  @Length(6, 6)
  codigo!: string;
}
