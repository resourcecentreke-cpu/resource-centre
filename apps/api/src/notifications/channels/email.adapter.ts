import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { NotificationChannel, OutboundMessage } from './channel.interface';

@Injectable()
export class EmailAdapter implements NotificationChannel {
  readonly channel = 'email' as const;
  private readonly logger = new Logger(EmailAdapter.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('SMTP_HOST'));
  }

  private transport(): Transporter {
    if (this.transporter) return this.transporter;
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT', 587)),
      secure: Number(this.config.get('SMTP_PORT', 587)) === 465,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
    return this.transporter;
  }

  async send(message: OutboundMessage): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM', 'Resource Centre <no-reply@resourcecentre.co.ke>');
    await this.transport().sendMail({
      from,
      to: message.to,
      subject: message.subject ?? 'Resource Centre',
      text: message.text,
      html: message.html ?? message.text,
    });
    this.logger.log(`Email sent to ${message.to}`);
  }
}
