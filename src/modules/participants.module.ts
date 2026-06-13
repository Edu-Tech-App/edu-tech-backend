import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizedParticipant } from '../entities/authorized-participant.entity';
import { ParticipantInvitationCode } from '../entities/participant-invitation-code.entity';
import { ParticipantsService } from '../services/participants.service';
import { ParticipantsController } from '../controllers/participants.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthorizedParticipant,
      ParticipantInvitationCode,
    ]),
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
