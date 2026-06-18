import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { EmailAdapter } from './channels/email.adapter';
import { SmsAdapter } from './channels/sms.adapter';
import { WhatsappAdapter } from './channels/whatsapp.adapter';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  providers: [NotificationsService, NotificationsProcessor, EmailAdapter, SmsAdapter, WhatsappAdapter],
  exports: [NotificationsService, BullModule],
})
export class NotificationsModule {}
