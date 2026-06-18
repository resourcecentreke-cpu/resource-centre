import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { TrustService } from './trust.service';

@Processor('maintenance')
export class TrustProcessor extends WorkerHost {
  private readonly logger = new Logger(TrustProcessor.name);

  constructor(private readonly trust: TrustService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    if (job.name === 'recompute-trust') return this.trust.recomputeAll();
    this.logger.warn(`Unknown maintenance job: ${job.name}`);
    return undefined;
  }
}
