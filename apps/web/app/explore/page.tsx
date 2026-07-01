import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import FlagshipCards from '../../components/FlagshipCards';
import TipPrompt from '../../components/TipPrompt';
import AdSlot from '../../components/AdSlot';
import type { ProductSummaryDTO } from '@rc/types';
import { abs, SITE_NAME } from '../../lib/seo';

export const revalidate = 60;

const TITLE = 'Explore — flagships, new arrivals & best prices';
const DESCRIPTION =
  'Dig deeper: this year’s five flagships, the newest arrivals, the lowest prices right now, and what’s launching next — all priced for Kenya.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: abs('/explore') },
  openGraph: { type: 'website', title: `${TITLE} · ${SITE_NAME}`, description: DESCRIPTION, url: abs('/explore') },
};

export default async function ExplorePage() {
  const [deals, fresh, premiumPhones] = await Promise.all([
    getProducts('?sort=price_asc&pageSize=8').catch(() => ({ items: [] as ProductSummaryDTO[] })),
    getProducts('?isNew=true&pageSize=8').catch(() => ({ items: [] as ProductSummaryDTO[] })),
    getProducts('?category=smartphones&sort=price_desc&pageSize=80').catch(() => ({ items: [] as ProductSummaryDTO[] })),
  ]);

  // Curated flagship line-up (real, in-stock equivalents of the requested set).
  const PREFERRED = [
    'galaxy s26 ultra',
    'pixel 10 pro xl',
    'iphone 17 pro max',
    'oppo find x9 ultra',
    'vivo x200 pro',
  ];
  const pool = premiumPhones.items;
  const flagships: ProductSummaryDTO[] = [];
  for (const want of PREFERRED) {
    const m = pool.find(
      (p) => p.name.toLowerCase().includes(want) && !flagships.some((f) => f.slug === p.slug),
    );
    if (m) flagships.push(m);
  }
  // Backfill to five with the priciest remaining distinct brands, if any preferred missing.
  if (flagships.length < 5) {
    const seenBrand = new Set(flagships.map((f) => f.brand));
    for (const p of pool) {
      if (flagships.length >= 5) break;
      if (flagships.some((f) => f.slug === p.slug) || seenBrand.has(p.brand)) continue;
      seenBrand.add(p.brand);
      flagships.push(p);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5">
      <nav className="pt-6 text-xs text-muted">
        <Link href="/" className="text-accent">Home</Link> / Explore
      </nav>

      {flagships.length > 0 && (
        <section className="pt-4 pb-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-coral">Five flagships · {new Date().getFullYear()}</p>
          <h1 className="mt-1 font-display text-2xl md:text-3xl font-bold">The best phones you can buy right now</h1>
          <p className="mt-1.5 text-mut text-sm max-w-2xl">Top flagships from the biggest names — tap any phone to compare live prices across Kenya's trusted stores. Prices indicative; confirm on the retailer's page.</p>
          <div className="mt-6">
            <FlagshipCards phones={flagships} />
          </div>
        </section>
      )}

      <section className="my-8 rounded-3xl border border-[#E3E6F4] bg-gradient-to-br from-bg2 to-[#F4F6FD] p-8">
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {[
            { ic: '📉', t: 'Price history', d: 'See whether today’s price is actually a deal — every drop, tracked over time.' },
            { ic: '🛡️', t: 'Seller trust scores', d: 'Buy with confidence from stores rated on reliability and delivery.' },
            { ic: '🚚', t: 'Delivery comparison', d: 'Compare delivery cost and speed across Nairobi and countrywide.' },
            { ic: '🔔', t: 'Price alerts', d: 'Get notified the moment your phone drops to your target price.' },
          ].map((x) => (
            <div key={x.t}>
              <div className="text-2xl">{x.ic}</div>
              <div className="mt-2 font-display font-bold">{x.t}</div>
              <p className="mt-1 text-sm text-mut leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-8">
        <Link href="/releases" className="group block rounded-3xl overflow-hidden border border-coral/25 bg-gradient-to-r from-[#241a44] via-[#2A1E4D] to-[#160f2e] text-white p-6 md:p-7 hover:-translate-y-0.5 transition">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">🆕 New &amp; Upcoming</span>
              <h2 className="font-display text-xl md:text-2xl font-bold mt-3">The latest global releases — priced for Kenya</h2>
              <p className="text-white/75 text-sm mt-1 max-w-xl">See what just launched, how old each device is, and what&apos;s coming next — iPhone 18, Pixel 11, Galaxy Z Fold8 and more.</p>
            </div>
            <span className="shrink-0 rounded-full bg-white text-[#2A1E4D] font-bold text-sm px-5 py-2.5 group-hover:bg-amber group-hover:text-ink transition">Explore releases →</span>
          </div>
        </Link>
      </section>

      <AdSlot className="my-2" />

      <Section title="Best prices right now" items={deals.items} />
      <Section title="New arrivals" items={fresh.items} />

      <div className="max-w-md pb-10">
        <TipPrompt />
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: ProductSummaryDTO[] }) {
  if (!items.length) return null;
  return (
    <section className="pb-8">
      <h2 className="font-display text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </section>
  );
}
