import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TrustService } from './trust.service';
import { TrustProcessor } from './trust.processor';
import { TrustScheduler } from './trust.scheduler';

@Module({
  imports: [BullModule.registerQueue({ name: 'maintenance' })],
  providers: [TrustService, TrustProcessor, TrustScheduler],
  exports: [TrustService],
})
export class TrustModule {}
