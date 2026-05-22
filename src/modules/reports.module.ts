import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsService } from '../services/reports.service';
import { Grade } from '../entities/grade.entity';
import { Loan } from '../entities/loan.entity';
import { Fine } from '../entities/fine.entity';
import { Book } from '../entities/book.entity';
import { Subject } from '../entities/subject.entity';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Loan, Fine, Book, Subject, User, Student])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
