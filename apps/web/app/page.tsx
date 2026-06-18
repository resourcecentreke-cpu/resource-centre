import Link from 'next/link';
import { getCategories, getProducts, getTopInterest } from '../lib/api';
import ProductCard from '../components/ProductCard';
import TopInterest from '../components/TopInterest';
import TipPrompt from '../components/TipPrompt';

export const revalidate = 60;

export default async function Home() {
  const [categories, deals, fresh, topPhones] = await Promise.all([
    getCategories(),
    getProducts('?sort=price_asc&pageSize=8'),
    getProducts('?isNew=true&pageSize=8'),
    getTopInterest('smartphones', 10).catch(() => []),
  ]);
  const live = categories.filter((c) => c.productCount > 0);

  return (
    <div className="max-w-6xl mx-auto px-5">
      <section className="py-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral shadow-sm">✨ Kenya · live price tracker</span>
        <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold leading-tight">
          Buy electronics in Kenya,{' '}
          <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">at the best price.</span>
        </h1>
        <p className="mt-3 text-mut max-w-xl">Compare phones, laptops, TVs, gaming, cameras and more across trusted stores — with price history, seller trust scores and delivery comparison.</p>
      </section>

      <section className="pb-8">
        <h2 className="font-display text-xl font-bold mb-4">Shop by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {live.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`}
              className="rounded-2xl border border-[#F1E7DC] bg-white p-4 text-center shadow-sm hover:-translate-y-1 hover:border-coral transition">
              <div className="font-bold text-sm">{c.name}</div>
              <div className="text-xs text-[#A99FB4] font-bold mt-0.5">{c.productCount} devices</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <Section title="Best prices right now" items={deals.items} />
          <Section title="New arrivals" items={fresh.items} />
        </div>
        <div className="lg:sticky lg:top-20">
          <TopInterest
            items={topPhones}
            title="Top 10 phones in Kenya"
            subtitle="Ranked by shopper interest — updated continuously"
          />
          <Link
            href="/c/smartphones"
            className="mt-3 block text-center text-sm font-semibold text-coral hover:underline"
          >
            See all phones →
          </Link>
          <div className="mt-4">
            <TipPrompt />
          </div>
        </div>
      </div>
      <div className="h-10" />
    </div>
  );
}

function Section({ title, items }: { title: string; items: import('@rc/types').ProductSummaryDTO[] }) {
  return (
    <section className="pb-8">
      <h2 className="font-display text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
    </section>
  );
}
