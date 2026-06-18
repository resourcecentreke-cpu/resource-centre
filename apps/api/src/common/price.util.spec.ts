import { priceStats, outboundUrl } from './price.util';

describe('priceStats', () => {
  it('computes lowest/highest/average and discount', () => {
    const s = priceStats(100000, [120000, 118000, 110000, 105000, 100000]);
    expect(s.lowest).toBe(100000);
    expect(s.highest).toBe(120000);
    expect(s.average).toBe(110600);
    expect(s.discountPct).toBe(17);
    expect(s.isGoodDeal).toBe(true);
  });
  it('flags not-a-deal when above average', () => {
    expect(priceStats(119000, [120000, 118000, 110000]).isGoodDeal).toBe(false);
  });
  it('handles empty history', () => {
    const s = priceStats(50000, []);
    expect(s.highest).toBe(50000);
    expect(s.discountPct).toBe(0);
  });
});

describe('outboundUrl', () => {
  it('appends tracking with existing query', () => {
    expect(outboundUrl('https://x.co/?s={q}', 'Galaxy S26+')).toBe(
      'https://x.co/?s=Galaxy%20S26%2B&utm_source=resourcecentre&utm_medium=referral',
    );
  });
  it('appends tracking without query', () => {
    expect(outboundUrl('https://x.co/search/{q}', 'iPhone 17')).toBe(
      'https://x.co/search/iPhone%2017?utm_source=resourcecentre&utm_medium=referral',
    );
  });
  it('returns null for null template', () => {
    expect(outboundUrl(null, 'x')).toBeNull();
  });
});
