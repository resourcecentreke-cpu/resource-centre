import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, OutboundMessage } from './channel.interface';

@Injectable()
export class WhatsappAdapter implements NotificationChannel {
  readonly channel = 'whatsapp' as const;
  private readonly logger = new Logger(WhatsappAdapter.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('WHATSAPP_TOKEN') && this.config.get<string>('WHATSAPP_PHONE_ID'));
  }

  async send(message: OutboundMessage): Promise<void> {
    const token = this.config.getOrThrow<string>('WHATSAPP_TOKEN');
    const phoneId = this.config.getOrThrow<string>('WHATSAPP_PHONE_ID');
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'text',
        text: { body: message.text },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp API responded ${res.status}`);
    this.logger.log(`WhatsApp sent to ${message.to}`);
  }
}
