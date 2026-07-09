import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { IntasendService } from '../payments/intasend.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, IntasendService],
  exports: [OrdersService],
})
export class OrdersModule {}
