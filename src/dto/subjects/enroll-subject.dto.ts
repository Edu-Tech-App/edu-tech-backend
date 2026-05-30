import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class EnrollSubjectDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario estudiante que se va a inscribir en la materia',
  })
  @IsInt()
  @IsNotEmpty()
  estudianteId!: number;
}
