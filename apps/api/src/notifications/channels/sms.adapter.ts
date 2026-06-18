import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, OutboundMessage } from './channel.interface';

@Injectable()
export class SmsAdapter implements NotificationChannel {
  readonly channel = 'sms' as const;
  private readonly logger = new Logger(SmsAdapter.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('SMS_API_KEY') && this.config.get<string>('SMS_USERNAME'));
  }

  async send(message: OutboundMessage): Promise<void> {
    const apiKey = this.config.getOrThrow<string>('SMS_API_KEY');
    const username = this.config.getOrThrow<string>('SMS_USERNAME');
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({ username, to: message.to, message: message.text }).toString(),
    });
    if (!res.ok) throw new Error(`SMS gateway responded ${res.status}`);
    this.logger.log(`SMS sent to ${message.to}`);
  }
}
