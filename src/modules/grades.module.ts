import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from '../entities/grade.entity';
import { User } from '../entities/user.entity';
import { Subject } from '../entities/subject.entity';
import { GradesController } from '../controllers/grades.controller';
import { GradesService } from '../services/grades.service';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grade, User, Subject]),
    NotificationsModule
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
