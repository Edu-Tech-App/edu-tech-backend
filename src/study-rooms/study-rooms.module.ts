import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyRoomsService } from './study-rooms.service';
import { StudyRoomsController } from './study-rooms.controller';
import { StudyRoom } from './entities/study-room.entity';
import { Reservation } from './entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyRoom, Reservation, User]),
    NotificationsModule,
  ],
  controllers: [StudyRoomsController],
  providers: [StudyRoomsService],
})
export class StudyRoomsModule {}
