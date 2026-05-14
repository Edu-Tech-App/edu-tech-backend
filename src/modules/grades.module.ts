import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from '../entities/grade.entity';
import { User } from '../entities/user.entity';
import { GradesController } from '../controllers/grades.controller';
import { GradesService } from '../services/grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, User])],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
