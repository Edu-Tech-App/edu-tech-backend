import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from '../services/stats.service';
import { StatsController } from '../controllers/stats.controller';
import { User } from '../entities/user.entity';
import { Book } from '../entities/book.entity';
import { Loan } from '../entities/loan.entity';
import { Fine } from '../entities/fine.entity';
import { Subject } from '../entities/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Book, Loan, Fine, Subject])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
