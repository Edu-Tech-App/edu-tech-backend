import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { Loan } from './entities/loan.entity';
import { Fine } from './entities/fine.entity';
import { Payment } from './entities/payment.entity';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { Student } from '../users/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, Fine, Payment, Book, User, Student])],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}
