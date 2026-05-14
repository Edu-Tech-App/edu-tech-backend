import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from '../services/notifications.service';
import { Loan } from '../entities/loan.entity';
import { User } from '../entities/user.entity';
import { Reservation } from '../entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, User, Reservation])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
