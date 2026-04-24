import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { User } from '../users/entities/user.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, User])],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}