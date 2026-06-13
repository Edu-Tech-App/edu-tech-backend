import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizedParticipant } from '../entities/authorized-participant.entity';
import { ParticipantsService } from '../services/participants.service';
import { ParticipantsController } from '../controllers/participants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorizedParticipant])],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
