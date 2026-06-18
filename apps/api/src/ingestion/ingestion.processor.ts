import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { IngestionService } from './ingestion.service';

@Processor('ingestion')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly ingestion: IngestionService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    if (job.name === 'ingest') return this.ingestion.run();
    this.logger.warn(`Unknown ingestion job: ${job.name}`);
    return undefined;
  }
}
