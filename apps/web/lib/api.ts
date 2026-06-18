import type {
  CategoryDTO, Paginated, ProductSummaryDTO, ProductDetailDTO, ReviewDTO, SearchSuggestion, DealDTO,
  TopInterestDTO,
} from '@rc/types';

function base(): string {
  // Server components hit the API directly; the browser uses the Next rewrite at /api.
  return typeof window === 'undefined'
    ? `${process.env.API_BASE_URL || 'http://localhost:4000'}/api`
    : '/api';
}

async function get<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(base() + path, { next: { revalidate } } as RequestInit);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const getCategories = () => get<CategoryDTO[]>('/categories');
export const getProducts = (qs = '') => get<Paginated<ProductSummaryDTO>>(`/products${qs}`);
export const getProduct = (slug: string) => get<ProductDetailDTO>(`/products/${slug}`, 30);
export const getDeals = (limit = 24) => get<DealDTO[]>(`/products/deals?limit=${limit}`, 120);
export const getTopInterest = (category?: string, limit = 10) =>
  get<TopInterestDTO[]>(`/products/top-interest?limit=${limit}${category ? `&category=${category}` : ''}`, 120);
export const getProductReviews = (slug: string) => get<ReviewDTO[]>(`/reviews/product/${slug}`, 30);
export const search = (qs: string) => get<Paginated<ProductSummaryDTO>>(`/search${qs}`);

export async function autocomplete(q: string): Promise<SearchSuggestion[]> {
  const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function logEvent(type: 'search' | 'product_view' | 'offer_click', extra: Record<string, string> = {}) {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...extra }),
    });
  } catch { /* analytics is best-effort */ }
}
