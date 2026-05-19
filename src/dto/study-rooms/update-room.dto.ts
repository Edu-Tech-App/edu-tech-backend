import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudyRoomStatus } from '../../entities/study-room.entity';

export class UpdateStudyRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacidad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ enum: StudyRoomStatus })
  @IsOptional()
  @IsEnum(StudyRoomStatus)
  estado?: StudyRoomStatus;
}
