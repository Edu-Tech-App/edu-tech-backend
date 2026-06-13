import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString, Length, MaxLength } from 'class-validator';

export class RegisterWithInvitationDto {
  @ApiProperty({
    example: 'Laura Gomez',
    description: 'Nombre de la persona que se registrará con el código de invitación',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({
    example: '482910',
    description: 'Código único de invitación de 6 dígitos',
  })
  @IsNumberString()
  @Length(6, 6)
  codigo!: string;
}
