import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from '../notifications/notifications.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsEvaluator } from './alerts.evaluator';
import { AlertsScheduler } from './alerts.scheduler';

@Module({
  imports: [BullModule.registerQueue({ name: 'alerts' }), NotificationsModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsEvaluator, AlertsScheduler],
  exports: [AlertsService],
})
export class AlertsModule {}
