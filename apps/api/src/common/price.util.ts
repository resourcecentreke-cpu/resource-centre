import type { PriceStats } from '@rc/types';

export function priceStats(current: number, history: number[]): PriceStats {
  const series = history.length ? history : [current];
  const highest = Math.max(...series);
  const lowest = Math.min(...series);
  const average = Math.round(series.reduce((a, b) => a + b, 0) / series.length);
  const discountPct = highest > 0 ? Math.max(0, Math.round(((highest - current) / highest) * 100)) : 0;
  return { current, lowest, highest, average, discountPct, isGoodDeal: current <= average };
}

/** Build an outbound store link with campaign tracking. */
export function outboundUrl(template: string | null, productName: string): string | null {
  if (!template) return null;
  const url = template.replace('{q}', encodeURIComponent(productName));
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}utm_source=resourcecentre&utm_medium=referral`;
}
