import { parseFeeConfig, computeServiceFee } from './order-fee.util';

describe('parseFeeConfig', () => {
  it('uses defaults for missing or bad env', () => {
    expect(parseFeeConfig({})).toEqual({ pct: 3, min: 200, max: 5000 });
    expect(parseFeeConfig({ ORDER_FEE_PCT: 'abc', ORDER_FEE_MIN: '-5' })).toEqual({
      pct: 3, min: 200, max: 5000,
    });
  });

  it('reads valid overrides', () => {
    expect(parseFeeConfig({ ORDER_FEE_PCT: '5', ORDER_FEE_MIN: '100', ORDER_FEE_MAX: '2000' }))
      .toEqual({ pct: 5, min: 100, max: 2000 });
  });
});

describe('computeServiceFee', () => {
  const cfg = { pct: 3, min: 200, max: 5000 };

  it('is pct of price within bounds', () => {
    expect(computeServiceFee(50000, cfg)).toBe(1500);
  });

  it('applies the floor for cheap items', () => {
    expect(computeServiceFee(2000, cfg)).toBe(200); // 3% = 60 → floor 200
  });

  it('applies the cap for expensive items', () => {
    expect(computeServiceFee(400000, cfg)).toBe(5000); // 3% = 12000 → cap 5000
  });

  it('returns 0 for non-positive prices', () => {
    expect(computeServiceFee(0, cfg)).toBe(0);
    expect(computeServiceFee(-10, cfg)).toBe(0);
  });
});
