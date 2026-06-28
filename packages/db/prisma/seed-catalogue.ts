/* Phase 2 — import the 61-product catalogue + offers + price-history baseline. */
import type { PrismaClient, Prisma } from '@prisma/client';
import { StockStatus } from '@prisma/client';
import catalogue from '../data/catalogue.json';
import { slugify, rng, brandOf, catKeyFor } from './seed-helpers';

interface CatItem {
  cat: string;
  name: string;
  spec: string;
  img: string;
  new: number;
  interest?: number; // baseline popularity weight (Top 10 by interest)
  released?: string; // "YYYY-MM" release month, for device age + new-releases feed
  specs?: Record<string, unknown>; // condition / battery / cycles / useCases
  stores: [string, number][];
}

/** Parse "YYYY-MM" into a Date (first of the month, UTC), or null. */
function parseReleased(s: string | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
}

const GSM = (slug: string) => `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg`;
const WEEK = 7 * 24 * 3600 * 1000;

export async function seedCatalogue(prisma: PrismaClient): Promise<void> {
  const sellers = await prisma.seller.findMany({ include: { metric: true } });
  const sellerByName = new Map(sellers.map((s) => [s.name, s]));
  const cats = await prisma.category.findMany();
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  const items = catalogue as unknown as CatItem[];
  let nOffers = 0;
  let nHist = 0;

  for (const d of items) {
    const catKey = catKeyFor(d.cat, d.name);
    const cat = catBySlug.get(slugify(catKey));
    if (!cat) throw new Error(`No category for "${d.name}" -> ${catKey}`);

    const slug = slugify(d.name);
    const imageSlug = d.img && d.img.charAt(0) !== '_' ? d.img : null;
    const images = imageSlug ? [GSM(imageSlug)] : [];
    const specsJson = (d.specs ?? undefined) as Prisma.InputJsonValue | undefined;
    const releaseDate = parseReleased(d.released);

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: d.name, brand: brandOf(d.name), categoryId: cat.id,
        specSummary: d.spec, imageSlug, images, isNew: Boolean(d.new),
        interestSeed: d.interest ?? 0, specs: specsJson, isActive: true, releaseDate,
      },
      create: {
        slug, name: d.name, brand: brandOf(d.name), categoryId: cat.id,
        specSummary: d.spec, imageSlug, images, isNew: Boolean(d.new),
        interestSeed: d.interest ?? 0, specs: specsJson, releaseDate,
      },
    });

    const min = Math.min(...d.stores.map((s) => s[1]));
    const max = Math.max(...d.stores.map((s) => s[1]));
    let cheapest: { price: number; sellerId: string; offerId: string } | null = null;

    for (const [storeName, price] of d.stores) {
      const seller = sellerByName.get(storeName);
      if (!seller) continue;
      const rr = rng(storeName + d.name);
      const fee = rr() < 0.55 ? 0 : [200, 300, 400, 500][Math.floor(rr() * 4)]!;
      const baseRating = seller.metric?.customerRating ?? 4.3;
      const rating = Math.min(5, Math.round((baseRating + (rr() - 0.5) * 0.5) * 10) / 10);
      const sv = rr();
      const inStock = sv < 0.1 ? StockStatus.OUT : sv < 0.28 ? StockStatus.LOW : StockStatus.IN;

      const offer = await prisma.offer.upsert({
        where: { productId_sellerId: { productId: product.id, sellerId: seller.id } },
        update: { price, deliveryFee: fee, inStock, rating, lastSeenAt: new Date() },
        create: { productId: product.id, sellerId: seller.id, price, deliveryFee: fee, inStock, rating },
      });
      nOffers++;
      if (!cheapest || price < cheapest.price) {
        cheapest = { price, sellerId: seller.id, offerId: offer.id };
      }
    }

    // Denormalized price summary for fast filtering/sorting.
    await prisma.product.update({
      where: { id: product.id },
      data: { minPrice: min, maxPrice: max, offerCount: d.stores.length },
    });

    // Price-history baseline: 12 weekly points trending down to the current min.
    const r = rng(d.name);
    let base = min * (1.1 + r() * 0.12);
    const hist: number[] = [];
    for (let i = 0; i < 11; i++) {
      base = base * (0.97 + r() * 0.05);
      hist.push(Math.round(base / 100) * 100);
    }
    hist.push(min);

    await prisma.priceHistory.deleteMany({ where: { productId: product.id } });
    const now = Date.now();
    for (let i = 0; i < hist.length; i++) {
      const isLast = i === hist.length - 1;
      await prisma.priceHistory.create({
        data: {
          productId: product.id,
          offerId: isLast ? cheapest?.offerId ?? null : null,
          sellerId: cheapest?.sellerId ?? null,
          price: hist[i]!,
          recordedAt: new Date(now - (hist.length - 1 - i) * WEEK),
        },
      });
      nHist++;
    }
  }

  console.log(`[seed] catalogue: ${items.length} products, ${nOffers} offers, ${nHist} history points`);
}
