import { Controller, Get } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getStats() {
    return this.statsService.getGeneralStats();
  }
}
