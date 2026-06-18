import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DarajaService } from '../mpesa/daraja.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, DarajaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
