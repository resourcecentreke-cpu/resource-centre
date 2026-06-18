import { maskEmail, reviewTypeToWire } from './reviews.util';

describe('reviews.util', () => {
  it('masks emails', () => {
    expect(maskEmail('brian@gmail.com')).toBe('b***@gmail.com');
    expect(maskEmail('a@x.co')).toBe('a***@x.co');
    expect(maskEmail('noatsign')).toBe('Resource Centre user');
  });
  it('maps review type to wire', () => {
    expect(reviewTypeToWire('STORE' as never)).toBe('store');
    expect(reviewTypeToWire('PRODUCT' as never)).toBe('product');
  });
});
