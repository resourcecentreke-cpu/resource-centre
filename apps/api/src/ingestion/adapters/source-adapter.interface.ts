export type RawStock = 'in' | 'low' | 'out';

/** A product as handed to adapters, including its current offers (for drift-based sources). */
export interface IngestProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  offers: { sellerSlug: string; price: number; deliveryFee: number; inStock: RawStock }[];
}

/** A single price observation an adapter returns. */
export interface RawListing {
  sellerSlug: string;
  productSlug?: string; // preferred when the source knows our slug
  name?: string; // used for fuzzy matching when slug is unknown
  price: number;
  deliveryFee?: number;
  inStock?: RawStock;
  url?: string;
}

/** Each seller / data source implements this. Disabled adapters are skipped. */
export interface SourceAdapter {
  readonly key: string;
  isEnabled(): boolean;
  fetchListings(products: IngestProduct[]): Promise<RawListing[]>;
}

export const SOURCE_ADAPTERS = 'SOURCE_ADAPTERS';
