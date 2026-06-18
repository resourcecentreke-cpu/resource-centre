import { shapeSummary } from './analytics.util';

describe('shapeSummary', () => {
  const input = {
    totals: { searches: 100, views: 40, clicks: 10 },
    searchGroups: [{ query: 'iphone', count: 30 }, { query: null, count: 5 }],
    storeGroups: [{ sellerId: 's1', count: 8 }, { sellerId: 'sX', count: 3 }],
    viewGroups: [{ productId: 'p1', count: 12 }, { productId: 'pX', count: 2 }],
    sellerNames: new Map([['s1', 'Jumia KE']]),
    productNames: new Map([['p1', { name: 'iPhone 17', slug: 'iphone-17' }]]),
  };
  it('computes conversion and drops null/unknown rows', () => {
    const out = shapeSummary(input);
    expect(out.conversionRate).toBe(0.25);
    expect(out.topSearches).toEqual([{ query: 'iphone', count: 30 }]);
    expect(out.topStores).toEqual([{ seller: 'Jumia KE', count: 8 }]);
    expect(out.mostViewed).toEqual([{ product: 'iPhone 17', slug: 'iphone-17', count: 12 }]);
  });
  it('avoids divide-by-zero', () => {
    expect(shapeSummary({ ...input, totals: { searches: 0, views: 0, clicks: 0 } }).conversionRate).toBe(0);
  });
});
