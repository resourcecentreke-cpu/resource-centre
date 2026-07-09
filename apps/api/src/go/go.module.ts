import { Module } from '@nestjs/common';
import { GoController } from './go.controller';
import { GoService } from './go.service';

@Module({
  controllers: [GoController],
  providers: [GoService],
})
export class GoModule {}
