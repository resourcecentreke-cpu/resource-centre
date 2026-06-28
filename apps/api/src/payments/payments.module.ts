import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DarajaService } from '../mpesa/daraja.service';
import { IntasendService } from './intasend.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, DarajaService, IntasendService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
