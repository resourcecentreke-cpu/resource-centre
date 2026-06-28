import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// IntaSend official Node SDK (CommonJS). Loaded via require so a build doesn't
// require the package to be installed on every machine just to typecheck.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const IntaSend = require('intasend-node');

export interface IntasendStkResult {
  invoiceId: string | null;
  raw: unknown;
}

/**
 * M-Pesa STK push via IntaSend (an aggregator that settles to your bank account).
 * Requires INTASEND_PUBLISHABLE_KEY + INTASEND_SECRET_KEY. Set INTASEND_ENV=test
 * to use the sandbox, anything else uses live.
 */
@Injectable()
export class IntasendService {
  private readonly logger = new Logger(IntasendService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get('INTASEND_SECRET_KEY') && this.config.get('INTASEND_PUBLISHABLE_KEY'),
    );
  }

  async stkPush(args: { amount: number; phone: string; ref: string }): Promise<IntasendStkResult> {
    const pub = this.config.getOrThrow<string>('INTASEND_PUBLISHABLE_KEY');
    const secret = this.config.getOrThrow<string>('INTASEND_SECRET_KEY');
    const test = this.config.get<string>('INTASEND_ENV', 'live') === 'test';

    const intasend = new IntaSend(pub, secret, test);
    const collection = intasend.collection();
    let resp: any;
    try {
      resp = await collection.mpesaStkPush({
        amount: args.amount,
        phone_number: args.phone,
        api_ref: args.ref,
        first_name: 'Resource',
        last_name: 'Centre Tip',
        email: this.config.get<string>('TIP_EMAIL', 'tips@resourcecentre.co.ke'),
        host: this.config.get<string>('SITE_URL', 'https://resourcecentre.co.ke'),
      });
    } catch (err: any) {
      // Surface IntaSend's actual validation/error body (the SDK only logs a status code).
      const detail = err?.response?.data ?? err?.data ?? err?.body ?? err?.message ?? err;
      this.logger.error(`IntaSend STK push rejected: ${JSON.stringify(detail)}`);
      throw err;
    }

    const invoiceId =
      (resp && resp.invoice && (resp.invoice.invoice_id as string)) ||
      (resp && (resp.invoice_id as string)) ||
      null;
    this.logger.log(`IntaSend STK push initiated (invoice ${invoiceId ?? 'unknown'})`);
    return { invoiceId, raw: resp };
  }
}
