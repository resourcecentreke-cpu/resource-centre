import { computeTrustScore } from './trust.util';

describe('computeTrustScore', () => {
  it('matches the seed formula for a top seller', () => {
    expect(computeTrustScore({ years: 11, rating: 4.7, deliveryPerformance: 0.88, returnWindowDays: 14, warranty: '12-mo' })).toBe(93);
  });
  it('clamps inputs and floors warranty', () => {
    expect(computeTrustScore({ years: 99, rating: 9, deliveryPerformance: 5, returnWindowDays: 99, warranty: null })).toBe(96);
    expect(computeTrustScore({ years: 0, rating: 0, deliveryPerformance: 0, returnWindowDays: 0, warranty: null })).toBe(6);
  });
});
