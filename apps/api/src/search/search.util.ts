import { ProductSort } from '../products/dto/product-query.dto';

export interface MeiliFilterInput {
  category?: string;
  brand?: string;
  isNew?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

const esc = (s: string): string => s.replace(/"/g, '\\"');

/** Build a Meilisearch filter expression array from query params. */
export function buildMeiliFilter(q: MeiliFilterInput): string[] {
  const f: string[] = [];
  if (q.category) f.push(`categorySlug = "${esc(q.category)}"`);
  if (q.brand) f.push(`brand = "${esc(q.brand)}"`);
  if (q.isNew !== undefined) f.push(`isNew = ${q.isNew}`);
  if (q.inStock) f.push('inStock = true');
  if (q.minPrice !== undefined) f.push(`minPrice >= ${q.minPrice}`);
  if (q.maxPrice !== undefined) f.push(`minPrice <= ${q.maxPrice}`);
  return f;
}

export function buildMeiliSort(sort: ProductSort): string[] {
  switch (sort) {
    case ProductSort.PriceDesc: return ['minPrice:desc'];
    case ProductSort.Newest: return ['createdAtTs:desc'];
    case ProductSort.Name: return ['name:asc'];
    default: return ['minPrice:asc'];
  }
}

export const PRODUCTS_INDEX = 'products';
export const INDEX_SETTINGS = {
  searchableAttributes: ['name', 'brand', 'category', 'specSummary'],
  filterableAttributes: ['categorySlug', 'brand', 'isNew', 'inStock', 'minPrice'],
  sortableAttributes: ['minPrice', 'createdAtTs', 'name'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
};
