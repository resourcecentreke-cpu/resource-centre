import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestProduct, RawListing, SourceAdapter } from './source-adapter.interface';

/**
 * Reads a normalized JSON product feed (the SAFE, preferred path — many Kenyan stores
 * and affiliate networks expose one). Expected shape:
 *   [{ sellerSlug, productSlug?, name?, price, deliveryFee?, inStock?, url? }, ...]
 * Disabled unless INGEST_FEED_URL is set. Real per-store HTML scrapers (where no feed
 * exists) should be added as additional adapters that respect robots.txt + rate limits.
 */
@Injectable()
export class FeedAdapter implements SourceAdapter {
  readonly key = 'feed';
  private readonly logger = new Logger(FeedAdapter.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.config.get<string>('INGEST_FEED_URL'));
  }

  async fetchListings(_products: IngestProduct[]): Promise<RawListing[]> {
    const url = this.config.getOrThrow<string>('INGEST_FEED_URL');
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`feed responded ${res.status}`);
      const data = (await res.json()) as RawListing[];
      return Array.isArray(data) ? data.filter((d) => d.sellerSlug && d.price > 0) : [];
    } catch (e) {
      this.logger.warn(`Feed fetch failed (${(e as Error).message}) — skipping this run.`);
      return [];
    }
  }
}
