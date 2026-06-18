import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class IngestionScheduler implements OnModuleInit {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(
    @InjectQueue('ingestion') private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const every = Number(this.config.get('INGEST_INTERVAL_MS', 21600000));
    try {
      await this.queue.add('ingest', {}, {
        repeat: { every },
        jobId: 'price-ingest',
        removeOnComplete: true,
        removeOnFail: 20,
      });
      this.logger.log(`Price ingestion scheduled every ${every / 1000}s`);
    } catch (e) {
      this.logger.warn(`Could not schedule ingestion: ${(e as Error).message}`);
    }
  }
}
