import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class AlertsScheduler implements OnModuleInit {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(
    @InjectQueue('alerts') private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const every = Number(this.config.get('ALERTS_INTERVAL_MS', 900000));
    try {
      await this.queue.add('evaluate', {}, {
        repeat: { every },
        jobId: 'alerts-eval',
        removeOnComplete: true,
        removeOnFail: 50,
      });
      this.logger.log(`Alert evaluation scheduled every ${every / 1000}s`);
    } catch (e) {
      this.logger.warn(`Could not schedule alert evaluation (Redis down?): ${(e as Error).message}`);
    }
  }
}
