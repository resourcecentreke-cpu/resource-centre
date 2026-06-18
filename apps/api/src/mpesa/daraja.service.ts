import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mpesaTimestamp, stkPassword } from './mpesa.util';

interface StkPushArgs {
  amount: number;
  msisdn: string;
  accountRef: string;
  description: string;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
}

@Injectable()
export class DarajaService {
  private readonly logger = new Logger(DarajaService.name);
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    return this.config.get('MPESA_ENV', 'sandbox') === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get('MPESA_CONSUMER_KEY') &&
        this.config.get('MPESA_CONSUMER_SECRET') &&
        this.config.get('MPESA_SHORTCODE') &&
        this.config.get('MPESA_PASSKEY'),
    );
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const key = this.config.getOrThrow<string>('MPESA_CONSUMER_KEY');
    const secret = this.config.getOrThrow<string>('MPESA_CONSUMER_SECRET');
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch(`${this.baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) throw new Error(`Daraja auth failed: ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: string };
    this.token = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in) * 1000 };
    return this.token.value;
  }

  async stkPush(args: StkPushArgs): Promise<StkPushResult> {
    const shortcode = this.config.getOrThrow<string>('MPESA_SHORTCODE');
    const passkey = this.config.getOrThrow<string>('MPESA_PASSKEY');
    const callbackUrl = this.config.getOrThrow<string>('MPESA_CALLBACK_URL');
    const timestamp = mpesaTimestamp();
    const token = await this.getToken();

    const res = await fetch(`${this.baseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: stkPassword(shortcode, passkey, timestamp),
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: args.amount,
        PartyA: args.msisdn,
        PartyB: shortcode,
        PhoneNumber: args.msisdn,
        CallBackURL: callbackUrl,
        AccountReference: args.accountRef.slice(0, 12),
        TransactionDesc: args.description.slice(0, 13),
      }),
    });
    const data = (await res.json()) as Record<string, string>;
    if (!res.ok || data.ResponseCode !== '0') {
      throw new Error(`STK push failed: ${data.errorMessage ?? data.ResponseDescription ?? res.status}`);
    }
    return {
      merchantRequestId: data.MerchantRequestID ?? '',
      checkoutRequestId: data.CheckoutRequestID ?? '',
      customerMessage: data.CustomerMessage ?? 'Check your phone to complete payment',
    };
  }
}
