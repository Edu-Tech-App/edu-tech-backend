import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateStudyRoomDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @Min(1)
  capacidad: number;

  @IsString()
  @IsNotEmpty()
  ubicacion: string;
}
