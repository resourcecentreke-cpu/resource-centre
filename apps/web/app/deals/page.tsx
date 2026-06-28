import type { Metadata } from 'next';
import Link from 'next/link';
import { getDeals } from '../../lib/api';
import { fmtKES } from '../../lib/format';
import { abs, SITE_NAME } from '../../lib/seo';
import JsonLd from '../../components/JsonLd';

// Refresh a few times an hour — deals change as prices move.
export const revalidate = 300;

const YEAR = new Date().getFullYear();
const TITLE = `Today’s best price drops in Kenya (${YEAR})`;
const DESCRIPTION =
  'The biggest electronics price drops across Kenya’s trusted online stores right now — phones, laptops, TVs and more. Updated continuously. Set an alert and never miss a deal.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: abs('/deals') },
  openGraph: { type: 'website', title: `${TITLE} · ${SITE_NAME}`, description: DESCRIPTION, url: abs('/deals') },
  twitter: { card: 'summary_large_image', title: `${TITLE} · ${SITE_NAME}`, description: DESCRIPTION },
};

export default async function DealsPage() {
  let deals: Awaited<ReturnType<typeof getDeals>> = [];
  try {
    deals = await getDeals(36);
  } catch {
    deals = [];
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: TITLE,
    numberOfItems: deals.length,
    itemListElement: deals.slice(0, 24).map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(`/p/${d.slug}`),
      name: d.name,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <JsonLd data={itemListJsonLd} />

      <nav className="text-xs text-mut mb-3">
        <Link href="/" className="text-coral">Home</Link> / Deals
      </nav>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-display text-2xl md:text-3xl font-bold">🔥 Today’s biggest price drops</h1>
        {deals.length > 0 && (
          <span className="rounded-full bg-coral/10 text-coral text-xs font-bold px-3 py-1">{deals.length} live deals</span>
        )}
      </div>
      <p className="text-mut text-sm max-w-2xl mt-2 mb-6">
        The electronics whose prices have fallen the most across Kenya’s trusted stores. Prices update continuously —
        <Link href="/alerts" className="text-coral font-semibold"> set a price alert</Link> to get pinged the moment something you want drops.
      </p>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-[#E3E6F4] bg-white p-8 text-center text-mut">
          No price drops to show right now. Check back soon — prices refresh throughout the day.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((d) => (
            <Link
              key={d.slug}
              href={`/p/${d.slug}`}
              className="group rounded-2xl border border-[#E3E6F4] bg-white p-4 hover:-translate-y-1 hover:shadow-md transition flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-[#A99FB4] font-bold">{d.brand} · {d.category}</span>
                <span className="rounded-full bg-[#1FAE78]/10 text-[#1FAE78] text-xs font-extrabold px-2 py-0.5 whitespace-nowrap">
                  −{d.dropPct}%
                </span>
              </div>

              <div className="h-32 my-3 flex items-center justify-center">
                {d.image ? (
                  <img src={d.image} alt={d.name} className="max-h-full max-w-[80%] object-contain drop-shadow" />
                ) : (
                  <span className="text-mut text-sm">{d.brand}</span>
                )}
              </div>

              <div className="font-bold text-sm leading-snug line-clamp-2">{d.name}</div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-xl font-bold text-coral">{fmtKES(d.currentPrice)}</span>
                <span className="text-xs text-mut line-through">{fmtKES(d.previousPrice)}</span>
              </div>
              <div className="text-[11px] text-[#1FAE78] font-bold mt-0.5">Save {fmtKES(d.dropAmount)}</div>
              {d.bestSeller && <div className="text-[11px] text-mut mt-1">Best at {d.bestSeller}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
