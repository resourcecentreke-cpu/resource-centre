import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestProduct, RawListing, RawStock, SourceAdapter } from './source-adapter.interface';

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic price drift in [-3%, +2%], rounded to KSh 100. Same seed → same result. */
export function driftPrice(base: number, seed: string): number {
  const r = (hash(seed) % 1000) / 1000; // 0..1
  const factor = 0.97 + r * 0.05;
  return Math.max(1000, Math.round((base * factor) / 100) * 100);
}

export function driftStock(seed: string): RawStock {
  const r = (hash(seed + ':stock') % 100) / 100;
  return r < 0.08 ? 'out' : r < 0.24 ? 'low' : 'in';
}

/**
 * Dev/staging source that nudges existing offer prices each day so the pipeline,
 * history graphs and alerts can be exercised without hitting real stores.
 */
@Injectable()
export class SimulationAdapter implements SourceAdapter {
  readonly key = 'simulation';

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return String(this.config.get('INGEST_SIMULATION', 'true')) === 'true';
  }

  async fetchListings(products: IngestProduct[]): Promise<RawListing[]> {
    const day = new Date().toISOString().slice(0, 10);
    const out: RawListing[] = [];
    for (const p of products) {
      for (const o of p.offers) {
        const seed = `${day}:${p.slug}:${o.sellerSlug}`;
        out.push({
          sellerSlug: o.sellerSlug,
          productSlug: p.slug,
          price: driftPrice(o.price, seed),
          deliveryFee: o.deliveryFee,
          inStock: driftStock(seed),
        });
      }
    }
    return out;
  }
}
