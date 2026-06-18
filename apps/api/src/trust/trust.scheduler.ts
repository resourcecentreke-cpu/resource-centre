import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class TrustScheduler implements OnModuleInit {
  private readonly logger = new Logger(TrustScheduler.name);

  constructor(
    @InjectQueue('maintenance') private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const every = Number(this.config.get('TRUST_RECOMPUTE_MS', 86400000));
    try {
      await this.queue.add('recompute-trust', {}, {
        repeat: { every },
        jobId: 'trust-recompute',
        removeOnComplete: true,
        removeOnFail: 20,
      });
      this.logger.log(`Trust recompute scheduled every ${every / 1000}s`);
    } catch (e) {
      this.logger.warn(`Could not schedule trust recompute: ${(e as Error).message}`);
    }
  }
}
