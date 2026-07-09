import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts, getCategories, getTopInterest } from '../../../lib/api';
import { fmtKES } from '../../../lib/format';
import { abs, priceString, SITE_NAME } from '../../../lib/seo';
import Filters from '../../../components/Filters';
import JsonLd from '../../../components/JsonLd';
import TopInterest from '../../../components/TopInterest';
import AdSlot from '../../../components/AdSlot';

export const revalidate = 60;

const YEAR = new Date().getFullYear();

async function load(slug: string) {
  const [cats, initial] = await Promise.all([
    getCategories(),
    getProducts(`?category=${slug}&sort=price_asc&pageSize=48`),
  ]);
  const cat = cats.find((c) => c.slug === slug);
  return { cat, initial };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { cat, initial } = await load(slug);
    const name = cat?.name ?? slug;
    const lowest = initial.items.length ? Math.min(...initial.items.map((p) => p.minPrice)) : null;
    const count = initial.total || initial.items.length;
    const title = `${name} prices in Kenya (${YEAR}) — Compare ${count}+ deals`;
    const description = lowest
      ? `Compare ${name.toLowerCase()} prices across Kenya’s trusted online stores. ${count}+ models from ${fmtKES(lowest)}, with price history, seller trust scores and delivery comparison.`
      : `Compare ${name.toLowerCase()} prices across Kenya’s trusted online stores, with price history, seller trust scores and delivery comparison.`;
    const canonical = abs(`/c/${slug}`);
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { type: 'website', title: `${title} · ${SITE_NAME}`, description, url: canonical },
      twitter: { card: 'summary_large_image', title: `${title} · ${SITE_NAME}`, description },
    };
  } catch {
    return { title: 'Category' };
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ cat, initial }, topItems] = await Promise.all([
    load(slug),
    getTopInterest(slug, 10).catch(() => []),
  ]);
  const name = cat?.name ?? slug;
  const lowest = initial.items.length ? Math.min(...initial.items.map((p) => p.minPrice)) : null;
  const count = initial.total || initial.items.length;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
      { '@type': 'ListItem', position: 2, name, item: abs(`/c/${slug}`) },
    ],
  };

  // ItemList of the products on this page helps Google understand the listing.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${name} in Kenya`,
    numberOfItems: initial.items.length,
    itemListElement: initial.items.slice(0, 24).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(`/p/${p.slug}`),
      name: p.name,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />

      <nav className="text-xs text-mut mb-3">
        <a href="/" className="text-coral">Home</a> / {name}
      </nav>

      <h1 className="font-display text-2xl font-bold mb-2">
        {name} prices in Kenya{' '}
        <span className="text-base font-normal text-mut">({YEAR})</span>
      </h1>

      <p className="text-mut text-sm max-w-2xl mb-5">
        Compare {count > 0 ? `${count}+ ` : ''}{name.toLowerCase()} across Kenya’s trusted online stores
        {lowest ? <> — prices from <b className="text-coral">{fmtKES(lowest)}</b></> : ''}. Each listing shows
        live price history, seller trust scores and delivery options, so you can spot the best deal and the right time to buy.
      </p>

      {slug === 'laptops' && (
        <Link href="/laptops/chooser" className="mb-5 flex items-center gap-3 rounded-2xl border border-coral/25 bg-gradient-to-r from-[#EEF1FB] to-[#F4F6FD] p-4 shadow-sm hover:border-coral transition">
          <span className="text-2xl">🧭</span>
          <span className="flex-1">
            <span className="block font-bold text-sm">Not sure which laptop to get?</span>
            <span className="block text-xs text-mut mt-0.5">Answer two quick questions — use-case and budget — and we’ll recommend one (new or refurbished).</span>
          </span>
          <span className="shrink-0 rounded-full bg-coral text-white text-xs font-bold px-4 py-2">Open the chooser →</span>
        </Link>
      )}
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="min-w-0">
          <Filters category={slug} initial={initial.items} />
        </div>
        {topItems.length > 0 && (
          <div className="lg:sticky lg:top-20 order-first lg:order-none">
            <TopInterest
              items={topItems}
              title={`Top 10 ${name.toLowerCase()} by interest`}
              subtitle="Most-viewed by shoppers in Kenya"
            />
          </div>
        )}
      </div>

      <AdSlot className="my-6" />
    </div>
  );
}
