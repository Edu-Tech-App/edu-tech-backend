import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyRoomsService } from '../services/study-rooms.service';
import { StudyRoomsController } from '../controllers/study-rooms.controller';
import { StudyRoom } from '../entities/study-room.entity';
import { Reservation } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyRoom, Reservation, User]),
    NotificationsModule,
  ],
  controllers: [StudyRoomsController],
  providers: [StudyRoomsService],
})
export class StudyRoomsModule {}
