import Link from 'next/link';
import { getCategories, getDeals, getProducts, getTopInterest } from '../lib/api';
import ProductCard from '../components/ProductCard';
import HeroShowcase from '../components/HeroShowcase';
import PriceDropTicker from '../components/PriceDropTicker';
import CategoryGroups from '../components/CategoryGroups';
import AdSlot from '../components/AdSlot';
import type { DealDTO, ProductSummaryDTO } from '@rc/types';

export const revalidate = 60;

/**
 * Homepage — one clear job per scroll-section:
 *   1. Hero + search
 *   2. Price drops (ticker + top deals)
 *   3. Shop by category (grouped)
 *   4. Top 10 phones in Kenya
 * Everything else (flagships, new arrivals, releases, tip) lives on /explore.
 */
export default async function Home() {
  const [categories, topPhones, deals, cheapest] = await Promise.all([
    getCategories(),
    getTopInterest('smartphones', 10).catch(() => []),
    getDeals(8).catch(() => [] as DealDTO[]),
    getProducts('?sort=price_asc&pageSize=8').catch(() => ({ items: [] as ProductSummaryDTO[] })),
  ]);
  const live = categories.filter((c) => c.productCount > 0);
  const heroPhones: ProductSummaryDTO[] = topPhones.length ? topPhones : cheapest.items;

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* 1 · Hero + search */}
      <section className="pt-8 pb-4">
        <HeroShowcase phones={heroPhones} />
      </section>

      {/* 2 · Price drops — the hook, right at the top */}
      <section className="pt-2 pb-8">
        <PriceDropTicker deals={deals} />
        {deals.length > 0 ? (
          <>
            <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold">Today’s top deals</h2>
              <Link href="/deals" className="text-sm font-semibold text-accent hover:underline">
                All price drops →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {deals.slice(0, 8).map((d) => (
                <ProductCard
                  key={d.slug}
                  p={{ ...d, minPrice: d.currentPrice }}
                  drop={{ pct: d.dropPct, previous: d.previousPrice }}
                />
              ))}
            </div>
          </>
        ) : (
          cheapest.items.length > 0 && (
            <>
              <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold">Lowest prices right now</h2>
                <Link href="/deals" className="text-sm font-semibold text-accent hover:underline">
                  All deals →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cheapest.items.map((p) => <ProductCard key={p.slug} p={p} />)}
              </div>
            </>
          )
        )}
      </section>

      {/* 3 · Shop by category — grouped, scannable */}
      <section className="pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">Shop by category</h2>
          <div className="flex gap-3 text-sm font-semibold">
            <Link href="/phones" className="text-accent hover:underline">Phones by tier & price →</Link>
            <Link href="/laptops/chooser" className="hidden text-accent hover:underline sm:inline">Laptop chooser →</Link>
          </div>
        </div>
        <CategoryGroups categories={live} />
      </section>

      <AdSlot className="my-2" />

      {/* 4 · Top 10 phones in Kenya */}
      {topPhones.length > 0 && (
        <section className="pb-8 pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold">Top 10 phones in Kenya</h2>
              <p className="mt-0.5 text-sm text-muted">Ranked by shopper interest — updated continuously</p>
            </div>
            <Link href="/c/smartphones" className="text-sm font-semibold text-accent hover:underline">
              See all phones →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topPhones.map((p) => <ProductCard key={p.slug} p={p} rank={p.rank} />)}
          </div>
        </section>
      )}

      {/* Everything else lives on /explore */}
      <section className="pb-10">
        <Link
          href="/explore"
          className="block rounded-2xl border border-line bg-surface px-5 py-4 text-center text-sm font-semibold text-accent shadow-xs transition duration-fast ease-out hover:border-line-strong"
        >
          Explore more — flagships, new arrivals & upcoming releases →
        </Link>
      </section>
    </div>
  );
}
