import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionService } from './ingestion.service';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionScheduler } from './ingestion.scheduler';
import { IngestionController } from './ingestion.controller';
import { SimulationAdapter } from './adapters/simulation.adapter';
import { FeedAdapter } from './adapters/feed.adapter';
import { SOURCE_ADAPTERS } from './adapters/source-adapter.interface';

@Module({
  imports: [BullModule.registerQueue({ name: 'ingestion' })],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionProcessor,
    IngestionScheduler,
    SimulationAdapter,
    FeedAdapter,
    {
      provide: SOURCE_ADAPTERS,
      useFactory: (sim: SimulationAdapter, feed: FeedAdapter) => [sim, feed],
      inject: [SimulationAdapter, FeedAdapter],
    },
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
