import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansService } from '../services/loans.service';
import { LoansController } from '../controllers/loans.controller';
import { Loan } from '../entities/loan.entity';
import { Fine } from '../entities/fine.entity';
import { Payment } from '../entities/payment.entity';
import { Book } from '../entities/book.entity';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, Fine, Payment, Book, User, Student]), NotificationsModule],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}
