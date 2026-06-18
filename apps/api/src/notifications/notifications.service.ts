import { Injectable, Logger } from '@nestjs/common';
import { EmailAdapter } from './channels/email.adapter';
import { SmsAdapter } from './channels/sms.adapter';
import { WhatsappAdapter } from './channels/whatsapp.adapter';
import { ChannelKey, NotificationChannel, OutboundMessage } from './channels/channel.interface';

export interface Recipient {
  email?: string | null;
  phone?: string | null;
}

export type DeliveryStatus = 'sent' | 'not-configured' | 'no-destination' | 'unsupported' | 'failed';

export interface DeliveryResult {
  channel: ChannelKey;
  status: DeliveryStatus;
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly channels: Record<ChannelKey, NotificationChannel>;

  constructor(email: EmailAdapter, sms: SmsAdapter, whatsapp: WhatsappAdapter) {
    this.channels = { email, sms, whatsapp };
  }

  /** Send one message across the requested channels. Never throws — returns a per-channel summary. */
  async dispatch(
    channels: ChannelKey[],
    recipient: Recipient,
    message: Omit<OutboundMessage, 'to'>,
  ): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];
    for (const ch of channels) {
      const adapter = this.channels[ch];
      const to = ch === 'email' ? recipient.email : recipient.phone;
      if (!adapter) {
        results.push({ channel: ch, status: 'unsupported' });
      } else if (!to) {
        results.push({ channel: ch, status: 'no-destination' });
      } else if (!adapter.isConfigured()) {
        this.logger.warn(`Channel "${ch}" not configured — skipping (would send to ${to}).`);
        results.push({ channel: ch, status: 'not-configured' });
      } else {
        try {
          await adapter.send({ to, ...message });
          results.push({ channel: ch, status: 'sent' });
        } catch (e) {
          this.logger.error(`Channel "${ch}" failed: ${(e as Error).message}`);
          results.push({ channel: ch, status: 'failed', error: (e as Error).message });
        }
      }
    }
    return results;
  }
}
