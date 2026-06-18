import { buildMeiliFilter, buildMeiliSort, INDEX_SETTINGS } from './search.util';
import { ProductSort } from '../products/dto/product-query.dto';

describe('buildMeiliFilter', () => {
  it('builds filters', () => {
    expect(buildMeiliFilter({ category: 'smartphones' })).toEqual(['categorySlug = "smartphones"']);
    expect(buildMeiliFilter({ brand: 'Apple', inStock: true })).toEqual(['brand = "Apple"', 'inStock = true']);
    expect(buildMeiliFilter({ minPrice: 20000, maxPrice: 80000 })).toEqual(['minPrice >= 20000', 'minPrice <= 80000']);
    expect(buildMeiliFilter({ isNew: false })).toEqual(['isNew = false']);
    expect(buildMeiliFilter({})).toEqual([]);
  });
  it('escapes quotes', () => {
    expect(buildMeiliFilter({ brand: 'O"Brien' })).toEqual(['brand = "O\\"Brien"']);
  });
});

describe('buildMeiliSort', () => {
  it('maps sorts', () => {
    expect(buildMeiliSort(ProductSort.PriceDesc)).toEqual(['minPrice:desc']);
    expect(buildMeiliSort(ProductSort.Newest)).toEqual(['createdAtTs:desc']);
    expect(buildMeiliSort(ProductSort.Name)).toEqual(['name:asc']);
    expect(buildMeiliSort(ProductSort.PriceAsc)).toEqual(['minPrice:asc']);
  });
  it('exposes filterable settings', () => {
    expect(INDEX_SETTINGS.filterableAttributes).toContain('categorySlug');
  });
});
