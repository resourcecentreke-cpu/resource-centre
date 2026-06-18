import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { AlertsService } from './alerts.service';

@Processor('alerts')
export class AlertsEvaluator extends WorkerHost {
  private readonly logger = new Logger(AlertsEvaluator.name);

  constructor(private readonly alerts: AlertsService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    if (job.name === 'evaluate') {
      return this.alerts.evaluateAll();
    }
    this.logger.warn(`Unknown alerts job: ${job.name}`);
    return undefined;
  }
}
