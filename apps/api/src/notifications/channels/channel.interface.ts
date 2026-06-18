export type ChannelKey = 'email' | 'sms' | 'whatsapp';

export interface OutboundMessage {
  to: string;
  subject?: string;
  text: string;
  html?: string;
}

export interface NotificationChannel {
  readonly channel: ChannelKey;
  isConfigured(): boolean;
  send(message: OutboundMessage): Promise<void>;
}

export const CHANNEL_TOKENS = {
  email: 'CHANNEL_EMAIL',
  sms: 'CHANNEL_SMS',
  whatsapp: 'CHANNEL_WHATSAPP',
} as const;
