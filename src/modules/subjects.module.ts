import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from '../entities/subject.entity';
import { Teacher } from '../entities/teacher.entity';
import { SubjectsService } from '../services/subjects.service';
import { SubjectsController } from '../controllers/subjects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Teacher])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
