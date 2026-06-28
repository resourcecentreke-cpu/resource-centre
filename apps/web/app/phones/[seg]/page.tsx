import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProducts } from '../../../lib/api';
import { findSegment, allSegmentSlugs, PHONE_TIERS, PHONE_BANDS } from '../../../lib/phoneTiers';
import { fmtKES } from '../../../lib/format';
import ProductCard from '../../../components/ProductCard';
import JsonLd from '../../../components/JsonLd';
import { abs, SITE_NAME } from '../../../lib/seo';

export const revalidate = 120;
const YEAR = new Date().getFullYear();

export function generateStaticParams() {
  return allSegmentSlugs().map((seg) => ({ seg }));
}

async function load(seg: string) {
  const s = findSegment(seg);
  if (!s) return null;
  const qs = `?category=smartphones&minPrice=${s.min}${s.max ? `&maxPrice=${s.max}` : ''}&sort=price_asc&pageSize=120`;
  const res = await getProducts(qs).catch(
    () => ({ items: [], total: 0, page: 1, pageSize: 120, totalPages: 0 }),
  );
  return { s, res };
}

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }): Promise<Metadata> {
  const { seg } = await params;
  const s = findSegment(seg);
  if (!s) return { title: 'Phones' };
  const title = `${s.label} in Kenya (${YEAR}) — prices & comparison`;
  return {
    title,
    description: `${s.blurb} Compare ${s.label.toLowerCase()} across Kenya’s trusted online stores with price history and seller trust scores.`,
    alternates: { canonical: abs(`/phones/${seg}`) },
    openGraph: { title: `${title} · ${SITE_NAME}`, url: abs(`/phones/${seg}`) },
  };
}

export default async function PhoneSegmentPage({ params }: { params: Promise<{ seg: string }> }) {
  const { seg } = await params;
  const data = await load(seg);
  if (!data) notFound();
  const { s, res } = data;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${s.label} in Kenya`,
    numberOfItems: res.items.length,
    itemListElement: res.items.slice(0, 24).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: abs(`/p/${p.slug}`), name: p.name,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <JsonLd data={[itemListJsonLd]} />
      <nav className="text-xs text-mut mb-3">
        <Link href="/" className="text-coral">Home</Link> / <Link href="/phones" className="text-coral">Phones</Link> / {s.label}
      </nav>
      <h1 className="font-display text-2xl font-bold">{s.label} in Kenya <span className="text-base font-normal text-mut">({YEAR})</span></h1>
      <p className="text-mut text-sm max-w-2xl mt-2 mb-4">
        {s.blurb} Price range {s.max ? <b className="text-coral">{fmtKES(s.min)} – {fmtKES(s.max)}</b> : <b className="text-coral">{fmtKES(s.min)}+</b>}. {res.total} models.
      </p>

      {/* Quick switch between the other tiers / bands */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[...PHONE_TIERS, ...PHONE_BANDS].map((o) => (
          <Link key={o.slug} href={`/phones/${o.slug}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${o.slug === seg ? 'bg-coral text-white border-coral' : 'border-[#D5DAF0] hover:border-coral'}`}>
            {o.label}
          </Link>
        ))}
      </div>

      {res.items.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {res.items.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      ) : (
        <p className="text-mut">No phones in this range yet — check back soon.</p>
      )}
    </div>
  );
}
