import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class ValidateInvitationCodeDto {
  @ApiProperty({
    example: '482910',
    description: 'Código único de invitación de 6 dígitos',
  })
  @IsNumberString()
  @IsNotEmpty()
  @Length(6, 6)
  codigo!: string;
}
