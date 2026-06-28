import type { Metadata } from 'next';
import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProduct, getProductReviews } from '../../../lib/api';
import { fmtKES, stars } from '../../../lib/format';
import PriceHistoryChart from '../../../components/PriceHistoryChart';
import ProductActions from '../../../components/ProductActions';
import ProductGallery from '../../../components/ProductGallery';
import JsonLd from '../../../components/JsonLd';
import { abs, priceString, SITE_NAME } from '../../../lib/seo';
import { deviceAge, releasedLabel } from '../../../lib/age';
import { buildProsCons, buildSpecSheet } from '../../../lib/prosCons';

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getProduct(slug);
    const title = `${p.name} price in Kenya — from ${fmtKES(p.minPrice)}`;
    const description = `Compare ${p.name} across ${p.offerCount} Kenyan stores. ${p.specSummary}. Best price ${fmtKES(p.minPrice)}.`;
    const canonical = abs(`/p/${p.slug}`);
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: 'website',
        title: `${title} · ${SITE_NAME}`,
        description,
        url: canonical,
        images: p.image ? [{ url: p.image, alt: p.name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} · ${SITE_NAME}`,
        description,
        images: p.image ? [p.image] : undefined,
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let p, reviews;
  try {
    [p, reviews] = await Promise.all([getProduct(slug), getProductReviews(slug).catch(() => [])]);
  } catch {
    notFound();
  }
  const best = p.offers[0];
  const { pros, cons } = buildProsCons(p);
  const specSheet = buildSpecSheet(p);

  // ───── Structured data: Product + AggregateOffer + Breadcrumbs ─────
  const inStockOffers = p.offers.filter((o) => o.inStock !== 'out');
  const ratingValues = reviews.map((r) => r.rating).filter((n) => n > 0);
  const avgRating = ratingValues.length
    ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
    : null;

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    brand: { '@type': 'Brand', name: p.brand },
    category: p.category,
    description: p.specSummary,
    ...(p.image ? { image: [p.image] } : {}),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'KES',
      lowPrice: priceString(p.minPrice),
      highPrice: priceString(p.maxPrice || p.minPrice),
      offerCount: p.offerCount || p.offers.length,
      availability: inStockOffers.length
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      offers: p.offers.map((o) => ({
        '@type': 'Offer',
        price: priceString(o.price),
        priceCurrency: 'KES',
        availability: o.inStock === 'out' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: abs(`/p/${p.slug}`),
        seller: { '@type': 'Organization', name: o.sellerName },
      })),
    },
    ...(avgRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            reviewCount: ratingValues.length,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
      { '@type': 'ListItem', position: 2, name: p.category, item: abs(`/c/${p.categorySlug}`) },
      { '@type': 'ListItem', position: 3, name: p.name, item: abs(`/p/${p.slug}`) },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />
      <div className="text-xs text-mut mb-4">
        <Link href="/" className="text-coral">Home</Link> / <Link href={`/c/${p.categorySlug}`} className="text-coral">{p.category}</Link> / {p.name}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <ProductGallery slug={p.slug} images={p.images} fallback={p.image} brand={p.brand} name={p.name} />
        <div>
          <div className="text-xs uppercase tracking-wide text-[#A99FB4] font-bold">{p.brand} · {p.category}</div>
          <h1 className="font-display text-2xl font-bold mt-1">
            {p.name}
            {p.specs?.condition === 'Refurbished' && <span className="ml-2 align-middle text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber/20 text-[#9a6a12]">REFURBISHED</span>}
          </h1>
          <p className="text-mut text-sm mt-2">{p.specSummary}</p>
          {(() => {
            const age = deviceAge(p.releaseDate);
            if (!age) return null;
            return (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    age.isUpcoming ? 'bg-coral/15 text-coral' : age.isFresh ? 'bg-mint/20 text-[#0e8f68]' : 'bg-[#EEF1FB] text-mut'
                  }`}
                >
                  {age.isUpcoming ? '⏳ ' : '📅 '}{age.label}
                </span>
                <span className="text-xs text-[#A99FB4] font-semibold">{releasedLabel(p.releaseDate)}</span>
              </div>
            );
          })()}
          {p.specs?.condition === 'Refurbished' && (p.specs.battery || typeof p.specs.cycles === 'number') && (
            <div className="mt-3 rounded-2xl border border-amber/40 bg-[#FBF3DA] p-3 text-sm">
              <div className="font-bold text-[#9a6a12] mb-1">🔋 Refurbished — battery report</div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-mut">
                {p.specs.battery && <span>Battery health: <b className="text-ink">{String(p.specs.battery)}</b></span>}
                {typeof p.specs.cycles === 'number' && <span>Charge cycles: <b className="text-ink">{p.specs.cycles}</b></span>}
              </div>
              <p className="text-[11px] text-mut mt-1.5">Professionally tested. Higher health % and fewer charge cycles mean more battery life left.</p>
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-mint bg-gradient-to-br from-mint/10 to-white p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-display text-3xl font-bold">{fmtKES(p.minPrice)}</div>
              <div className="text-xs text-mut">Best price at {p.bestSeller} · {best?.deliveryFee ? fmtKES(best.deliveryFee) + ' delivery' : 'Free delivery'}</div>
            </div>
            {best && <a href={best.productUrl} target="_blank" rel="noopener sponsored noreferrer" className="px-5 py-2.5 rounded-full bg-coral text-white font-bold text-sm">Buy at {best.sellerName} →</a>}
          </div>
          <ProductActions slug={p.slug} productId={p.id} suggestedTarget={Math.round((p.minPrice * 0.95) / 1000) * 1000} />
        </div>
      </div>

      <Section title="Price comparison" subtitle={`Updated ${new Date(p.updatedAt).toLocaleDateString('en-KE')}`}>
        <div className="overflow-x-auto rounded-2xl border border-[#E3E6F4] bg-white">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-[#A99FB4]"><th className="p-3">Store</th><th className="p-3">Price</th><th className="p-3">Delivery</th><th className="p-3">Rating</th><th className="p-3">Trust</th><th className="p-3">Stock</th><th></th></tr></thead>
            <tbody>
              {p.offers.map((o, i) => {
                const out = o.inStock === 'out';
                // Index of the first out-of-stock offer — insert a divider row above it.
                const firstOut = p.offers.findIndex((x) => x.inStock === 'out');
                const showDivider = out && i === firstOut;
                return (
                  <Fragment key={o.sellerId}>
                    {showDivider && (
                      <tr className="border-t border-[#E3E6F4] bg-[#EEF1FB]">
                        <td colSpan={7} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A99FB4]">Out of stock at these stores</td>
                      </tr>
                    )}
                    <tr className={`border-t border-[#E3E6F4] ${i === 0 && !out ? 'bg-mint/5' : ''} ${out ? 'opacity-60' : ''}`}>
                      <td className="p-3 font-semibold">{o.sellerName}{i === 0 && !out && <span className="ml-2 text-[10px] text-coral font-bold">BEST</span>}</td>
                      <td className="p-3 font-bold" style={{ color: i === 0 && !out ? '#3D52D5' : undefined }}>{fmtKES(o.price)}</td>
                      <td className="p-3">{o.deliveryFee ? fmtKES(o.deliveryFee) : <span className="text-[#1FAE78] font-bold">Free</span>}</td>
                      <td className="p-3 text-[#E8902B] font-bold">★ {o.rating}</td>
                      <td className="p-3"><b>{o.trustScore}</b><span className="text-[#A99FB4]">/100</span></td>
                      <td className="p-3">{o.inStock === 'in' ? '🟢 In stock' : o.inStock === 'low' ? '🟡 Low' : '🔴 Out of stock'}</td>
                      <td className="p-3">{out
                        ? <span className="text-[#A99FB4] text-xs">Unavailable</span>
                        : <a href={o.productUrl} target="_blank" rel="noopener sponsored noreferrer" className="text-coral font-bold text-xs">View price →</a>}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Pros & cons">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-mint/40 bg-[#F1FBF6] p-4">
            <h4 className="font-bold text-sm text-[#0e8f68] mb-2">👍 Pros</h4>
            <ul className="space-y-1.5">
              {pros.map((pro, i) => (
                <li key={i} className="text-sm text-ink/90 flex gap-2"><span className="text-[#1FAE78]">✓</span><span>{pro}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#F0CFCF] bg-[#FCF3F3] p-4">
            <h4 className="font-bold text-sm text-[#C0463F] mb-2">👎 Cons</h4>
            <ul className="space-y-1.5">
              {cons.map((con, i) => (
                <li key={i} className="text-sm text-ink/90 flex gap-2"><span className="text-[#D9534F]">✕</span><span>{con}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-[11px] text-mut mt-2">Pros and cons are generated from the device’s specifications and current pricing to help you compare quickly.</p>
      </Section>

      <Section title="Specifications">
        <div className="rounded-2xl border border-[#E3E6F4] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {specSheet.map((row, i) => (
                <tr key={i} className="border-t border-[#E3E6F4] first:border-0">
                  <td className="p-3 text-mut w-1/3 align-top">{row.label}</td>
                  <td className="p-3 font-semibold">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-mut mt-2">Key specs summarised — confirm full specifications on the retailer’s page before buying.</p>
      </Section>

      <Section title="Price history">
        <div className="rounded-2xl border border-[#E3E6F4] bg-white p-4">
          <div className="flex gap-6 flex-wrap mb-3 text-sm">
            <Stat label="Lowest" value={fmtKES(p.priceStats.lowest)} color="#1FAE78" />
            <Stat label="Highest" value={fmtKES(p.priceStats.highest)} color="#E25555" />
            <Stat label="Average" value={fmtKES(p.priceStats.average)} />
            <Stat label="Current" value={fmtKES(p.priceStats.current)} color="#3D52D5" />
          </div>
          <PriceHistoryChart history={p.history} />
          <p className="text-xs text-mut mt-2">{p.priceStats.isGoodDeal ? '✅ Current price is at or below the average — a good time to buy.' : '⏳ Current price is above the average — it may drop.'}</p>
        </div>
      </Section>

      <Section title="Delivery comparison">
        <div className="overflow-x-auto rounded-2xl border border-[#E3E6F4] bg-white">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase text-[#A99FB4]"><th className="p-3">Store</th><th className="p-3">City</th><th className="p-3">Days</th><th className="p-3">Fee</th></tr></thead>
            <tbody>
              {p.delivery.map((d, i) => (
                <tr key={i} className="border-t border-[#E3E6F4]"><td className="p-3 font-semibold">{d.sellerName}</td><td className="p-3">{d.city}</td><td className="p-3">{d.days}</td><td className="p-3">{d.fee ? fmtKES(d.fee) : <span className="text-[#1FAE78] font-bold">Free</span>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Reviews">
        {reviews.length ? reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[#E3E6F4] bg-white p-4 mb-2">
            <div className="flex justify-between"><span className="font-bold text-sm">{r.author}</span><span className="text-[#E8902B] text-sm">{stars(r.rating)}</span></div>
            {r.title && <div className="font-semibold text-sm mt-1">{r.title}</div>}
            <p className="text-sm text-mut mt-1">{r.body}</p>
          </div>
        )) : <p className="text-mut text-sm">No reviews yet.</p>}
      </Section>

      {p.similar.length > 0 && (
        <Section title="Similar devices">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {p.similar.map((s) => (
              <Link key={s.slug} href={`/p/${s.slug}`} className="rounded-2xl border border-[#E3E6F4] bg-white p-3 hover:-translate-y-1 transition">
                <div className="font-bold text-sm">{s.name}</div>
                <div className="text-coral font-bold text-sm mt-1">{fmtKES(s.minPrice)}</div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="font-display text-lg font-bold mb-3">{title}{subtitle && <span className="ml-2 text-xs font-normal text-mut">{subtitle}</span>}</h3>
      {children}
    </section>
  );
}
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div><div className="font-bold" style={{ color }}>{value}</div><div className="text-[10px] uppercase text-[#A99FB4] font-bold">{label}</div></div>;
}
