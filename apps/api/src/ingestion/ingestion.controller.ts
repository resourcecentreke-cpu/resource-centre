import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('ingestion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('ingestion')
export class IngestionController {
  constructor(@InjectQueue('ingestion') private readonly queue: Queue) {}

  @Post('run')
  async run() {
    await this.queue.add('ingest', {}, { removeOnComplete: true, removeOnFail: 20 });
    return { queued: true };
  }
}
