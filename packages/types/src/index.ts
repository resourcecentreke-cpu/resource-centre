// Shared types used across api + web. Expands every phase.

export type StockStatus = 'in' | 'low' | 'out';
export type ReviewType = 'product' | 'store';
export type AlertChannel = 'email' | 'sms' | 'whatsapp';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

/** Money is stored in KES minor units (cents) in the DB; helpers convert for display. */
export type MoneyMinor = number;

export interface OfferDTO {
  /** Offer row id — used by the /api/go/:offerId affiliate redirect. */
  id: string;
  sellerId: string;
  sellerName: string;
  price: MoneyMinor;
  deliveryFee: MoneyMinor;
  inStock: StockStatus;
  rating: number;
  trustScore: number;
  productUrl: string;
  /** Tracked outbound link (click logging + affiliate codes). Prefer over productUrl. */
  goUrl: string;
  lastSeenAt: string;
}

export interface ProductSummaryDTO {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  specSummary: string;
  image: string | null;
  minPrice: MoneyMinor;
  isNew: boolean;
  /** Release month as an ISO date string (device age + new-releases feed); null if unknown. */
  releaseDate?: string | null;
  /** Extra structured attributes: condition, battery, cycles, useCases, etc. */
  specs?: ProductSpecs | null;
}

/** Free-form structured attributes stored per product (esp. laptops/refurbished). */
export interface ProductSpecs {
  condition?: 'New' | 'Refurbished' | string;
  battery?: string; // e.g. "88%" battery health for refurbished units
  cycles?: number; // charge-cycle count for refurbished units
  useCases?: string[]; // e.g. ["gaming","design"] — powers the laptop chooser
  [key: string]: unknown;
}

/** A ranked product for the "Top 10 by interest" widget (GSM-Arena-style daily interest). */
export interface TopInterestDTO extends ProductSummaryDTO {
  rank: number;
  interest: number; // blended score: baseline seed + live product views
}

/** An active paid placement, rendered with a "Sponsored" badge on the storefront. */
export interface SponsoredListingDTO {
  id: string;
  sellerName: string;
  sellerSlug: string;
  sellerWebsite: string | null;
  placement: string;
  endsAt: string;
  product: ProductSummaryDTO | null;
}

/** A product whose current price has dropped versus its recent high — for the Deals page. */
export interface DealDTO extends ProductSummaryDTO {
  currentPrice: MoneyMinor;
  previousPrice: MoneyMinor;
  dropAmount: MoneyMinor;
  dropPct: number;
  bestSeller: string | null;
}

// ───────── API response shapes (Phase 3) ─────────
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryDTO {
  name: string;
  slug: string;
  icon: string | null;
  productCount: number;
}

export interface PriceStats {
  current: MoneyMinor;
  lowest: MoneyMinor;
  highest: MoneyMinor;
  average: MoneyMinor;
  discountPct: number; // vs highest in history window
  isGoodDeal: boolean; // current <= average
}

export interface PriceHistoryPoint {
  price: MoneyMinor;
  recordedAt: string;
}

export interface DeliveryDTO {
  sellerName: string;
  city: string;
  days: string;
  fee: MoneyMinor;
}

export interface ProductDetailDTO extends ProductSummaryDTO {
  maxPrice: MoneyMinor;
  offerCount: number;
  images: string[];
  bestSeller: string | null;
  offers: OfferDTO[];
  priceStats: PriceStats;
  history: PriceHistoryPoint[];
  delivery: DeliveryDTO[];
  similar: ProductSummaryDTO[];
  updatedAt: string;
}

export interface SearchSuggestion {
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string | null;
  minPrice: MoneyMinor;
}

// ───────── Auth (Phase 5) ─────────
export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  locale: string;
  isVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access token TTL in seconds
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

// ───────── Alerts (Phase 6) ─────────
export type AlertStatusWire = 'active' | 'triggered' | 'paused' | 'cancelled';

export interface AlertDTO {
  id: string;
  productSlug: string;
  productName: string;
  image: string | null;
  targetPrice: MoneyMinor;
  currentPrice: MoneyMinor;
  targetHit: boolean;
  channels: AlertChannel[];
  status: AlertStatusWire;
  lastNotifiedAt: string | null;
  createdAt: string;
}

// ───────── Reviews & seller trust (Phase 8) ─────────
export type ReviewTypeWire = 'product' | 'store';

export interface ReviewDTO {
  id: string;
  type: ReviewTypeWire;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

export interface SellerProfileDTO {
  name: string;
  slug: string;
  website: string | null;
  isVerified: boolean;
  yearsInBusiness: number;
  returnWindowDays: number;
  warranty: string | null;
  trustScore: number;
  customerRating: number;
  reviewCount: number;
}

// ───────── Payments / M-Pesa (Phase 10) ─────────
export type PaymentPurpose = 'subscription' | 'sponsored';
export type PaymentStatusWire = 'pending' | 'completed' | 'failed';

export interface PaymentDTO {
  id: string;
  purpose: PaymentPurpose;
  amount: MoneyMinor;
  status: PaymentStatusWire;
  reference: string | null;
  mpesaReceipt: string | null;
  createdAt: string;
}

export interface StkInitResponse {
  paymentId: string;
  checkoutRequestId: string;
  customerMessage: string;
}

// ───────── Analytics (Phase 11) ─────────
export type AnalyticsEventType = 'search' | 'product_view' | 'offer_click';

export interface AnalyticsSummaryDTO {
  totals: { searches: number; views: number; clicks: number };
  conversionRate: number; // clicks / views
  topSearches: { query: string; count: number }[];
  topStores: { seller: string; count: number }[];
  mostViewed: { product: string; slug: string; count: number }[];
}
