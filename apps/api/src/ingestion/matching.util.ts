export interface MatchProductRef {
  id: string;
  slug: string;
  name: string;
}

export interface MatchInput {
  productSlug?: string;
  name?: string;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter(Boolean));
}

export function jaccard(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
}

/** Resolve a listing to a product id: slug → exact normalized name → best fuzzy (>=0.6). */
export function matchProduct(
  listing: MatchInput,
  products: MatchProductRef[],
  threshold = 0.6,
): string | null {
  if (listing.productSlug) {
    const bySlug = products.find((p) => p.slug === listing.productSlug);
    if (bySlug) return bySlug.id;
  }
  if (listing.name) {
    const n = normalize(listing.name);
    const exact = products.find((p) => normalize(p.name) === n);
    if (exact) return exact.id;
    let best: MatchProductRef | null = null;
    let score = 0;
    for (const p of products) {
      const s = jaccard(listing.name, p.name);
      if (s > score) {
        score = s;
        best = p;
      }
    }
    if (best && score >= threshold) return best.id;
  }
  return null;
}
