import { matchProduct, normalize } from './matching.util';

const products = [
  { id: 'p1', slug: 'samsung-galaxy-s26-ultra', name: 'Samsung Galaxy S26 Ultra' },
  { id: 'p2', slug: 'iphone-17-pro', name: 'iPhone 17 Pro' },
];

describe('matchProduct', () => {
  it('matches by slug', () => {
    expect(matchProduct({ productSlug: 'iphone-17-pro' }, products)).toBe('p2');
  });
  it('matches exact normalized name', () => {
    expect(matchProduct({ name: 'Samsung Galaxy S26 Ultra' }, products)).toBe('p1');
  });
  it('fuzzy matches extra tokens', () => {
    expect(matchProduct({ name: 'Samsung Galaxy S26 Ultra 5G 256GB' }, products)).toBe('p1');
  });
  it('returns null when nothing matches', () => {
    expect(matchProduct({ name: 'Unrelated Toaster 9000' }, products)).toBeNull();
  });
  it('falls back to fuzzy when slug misses', () => {
    expect(matchProduct({ productSlug: 'nope', name: 'iPhone 17 Pro Max' }, products)).toBe('p2');
  });
  it('normalizes strings', () => {
    expect(normalize('iPhone 17  Pro!!')).toBe('iphone 17 pro');
  });
});
