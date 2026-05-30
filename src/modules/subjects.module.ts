import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from '../entities/subject.entity';
import { Teacher } from '../entities/teacher.entity';
import { Student } from '../entities/student.entity';
import { User } from '../entities/user.entity';
import { SubjectEnrollment } from '../entities/subject-enrollment.entity';
import { SubjectsService } from '../services/subjects.service';
import { SubjectsController } from '../controllers/subjects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Teacher, Student, User, SubjectEnrollment])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
