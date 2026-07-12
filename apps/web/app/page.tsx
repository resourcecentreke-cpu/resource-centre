import Link from 'next/link';
import { getCategories, getDeals, getProducts, getTopInterest, getSponsored, getSellers } from '../lib/api';
import ProductCard from '../components/ProductCard';
import SearchBand from '../components/SearchBand';
import PriceDropTicker from '../components/PriceDropTicker';
import CategoryGroups from '../components/CategoryGroups';
import SponsoredStrip from '../components/SponsoredStrip';
import StatsBand from '../components/StatsBand';
import RecentlyViewed from '../components/RecentlyViewed';
import Reveal from '../components/Reveal';
import AdSlot from '../components/AdSlot';
import type { DealDTO, ProductSummaryDTO } from '@rc/types';

export const revalidate = 60;

/**
 * Homepage — search-first, money-first. No billboard hero: shoppers land on
 * search + budget shortcuts, then today's drops, then the products Kenya
 * actually wants (live interest analytics). One job per section.
 */
export default async function Home() {
  const [categories, topPhones, deals, cheapest, sponsored, sellers] = await Promise.all([
    getCategories(),
    getTopInterest('smartphones', 10).catch(() => []),
    getDeals(12).catch(() => [] as DealDTO[]),
    getProducts('?sort=price_asc&pageSize=12').catch(() => ({ items: [] as ProductSummaryDTO[] })),
    getSponsored('home').catch(() => []),
    getSellers().catch(() => []),
  ]);
  const live = categories.filter((c) => c.productCount > 0);
  const totalProducts = live.reduce((sum, c) => sum + c.productCount, 0);
  const stats = [
    { value: totalProducts, suffix: '+', label: 'Products tracked' },
    { value: sellers.length, label: 'Trusted stores' },
    { value: live.length, label: 'Categories' },
    { value: deals.length, label: 'Price drops today' },
  ].filter((s) => s.value > 0);

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* 1 · Search + budget shortcuts (the hero is gone — search IS the hero) */}
      <SearchBand mostWanted={topPhones.map((p) => ({ name: p.name, slug: p.slug }))} />

      {/* 2 · Today's drops — the money section, straight after search */}
      <Reveal>
      <section className="pb-10">
        <PriceDropTicker deals={deals} />
        {(deals.length > 0 || cheapest.items.length > 0) && (
          <>
            <div className="mt-6 mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {deals.length ? 'Today’s top deals' : 'Lowest prices right now'}
                </h2>
                {deals.length > 0 && <span className="text-sm font-semibold text-mint">All with price drops</span>}
              </div>
              <Link href="/deals" className="text-sm font-bold text-text underline underline-offset-4 hover:text-accent">
                See all
              </Link>
            </div>
            <Carousel>
              {(deals.length ? deals : cheapest.items).map((p) => (
                <CarouselItem key={p.slug}>
                  {'dropPct' in p ? (
                    <ProductCard
                      p={{ ...(p as DealDTO), minPrice: (p as DealDTO).currentPrice }}
                      drop={{ pct: (p as DealDTO).dropPct, previous: (p as DealDTO).previousPrice }}
                    />
                  ) : (
                    <ProductCard p={p} />
                  )}
                </CarouselItem>
              ))}
            </Carousel>
          </>
        )}
      </section>
      </Reveal>

      {/* 3 · Most wanted in Kenya — live interest analytics */}
      {topPhones.length > 0 && (
        <Reveal>
        <section className="pb-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Most wanted in Kenya 🇰🇪</h2>
              <p className="mt-0.5 text-sm text-muted">What shoppers are comparing right now — updated continuously</p>
            </div>
            <Link href="/c/smartphones" className="text-sm font-bold text-text underline underline-offset-4 hover:text-accent">
              See all phones
            </Link>
          </div>
          <Carousel>
            {topPhones.map((p) => (
              <CarouselItem key={p.slug}>
                <ProductCard p={p} rank={p.rank} />
              </CarouselItem>
            ))}
          </Carousel>
        </section>
        </Reveal>
      )}

      {/* Paid placements — only shows when a campaign is live */}
      <SponsoredStrip items={sponsored} />

      <AdSlot className="my-2" />

      {/* 4 · Categories */}
      <Reveal>
      <section className="pt-6 pb-10">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold tracking-tight">Explore popular categories</h2>
          <div className="flex gap-4 text-sm font-bold">
            <Link href="/phones" className="text-text underline underline-offset-4 hover:text-accent">Phones by tier</Link>
            <Link href="/laptops/chooser" className="hidden text-text underline underline-offset-4 hover:text-accent sm:inline">Laptop chooser</Link>
          </div>
        </div>
        <CategoryGroups categories={live} />
      </section>
      </Reveal>

      {/* Live catalogue numbers */}
      {stats.length > 0 && (
        <Reveal className="pb-10">
          <StatsBand stats={stats} />
        </Reveal>
      )}

      {/* Returning shoppers: continue where they stopped */}
      <RecentlyViewed />

      {/* Everything else lives on /explore */}
      <section className="pb-10">
        <Link
          href="/explore"
          className="block rounded-2xl border-2 border-text bg-surface px-5 py-4 text-center text-sm font-bold text-text transition duration-fast ease-out hover:bg-bg2"
        >
          Explore more — flagships, new arrivals &amp; upcoming releases →
        </Link>
      </section>
    </div>
  );
}

/** eBay-style horizontal snap carousel (no visible scrollbar). */
function Carousel({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

function CarouselItem({ children }: { children: React.ReactNode }) {
  return <div className="w-44 shrink-0 snap-start sm:w-48">{children}</div>;
}
