import type { AnalyticsSummaryDTO } from '@rc/types';

export interface ShapeInput {
  totals: { searches: number; views: number; clicks: number };
  searchGroups: { query: string | null; count: number }[];
  storeGroups: { sellerId: string | null; count: number }[];
  viewGroups: { productId: string | null; count: number }[];
  sellerNames: Map<string, string>;
  productNames: Map<string, { name: string; slug: string }>;
}

export function shapeSummary(i: ShapeInput): AnalyticsSummaryDTO {
  const conversionRate = i.totals.views > 0
    ? Math.round((i.totals.clicks / i.totals.views) * 1000) / 1000
    : 0;
  return {
    totals: i.totals,
    conversionRate,
    topSearches: i.searchGroups
      .filter((g) => g.query)
      .map((g) => ({ query: g.query as string, count: g.count })),
    topStores: i.storeGroups
      .filter((g) => g.sellerId && i.sellerNames.has(g.sellerId))
      .map((g) => ({ seller: i.sellerNames.get(g.sellerId as string) as string, count: g.count })),
    mostViewed: i.viewGroups
      .filter((g) => g.productId && i.productNames.has(g.productId))
      .map((g) => {
        const p = i.productNames.get(g.productId as string)!;
        return { product: p.name, slug: p.slug, count: g.count };
      }),
  };
}
