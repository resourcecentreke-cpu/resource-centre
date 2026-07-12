import type { Metadata } from 'next';
import Link from 'next/link';
import type { SellerProfileDTO } from '@rc/types';
import { getSellers } from '../../lib/api';
import { abs, SITE_NAME } from '../../lib/seo';
import AdSlot from '../../components/AdSlot';

const YEAR = new Date().getFullYear();
const TITLE = `Kenya's trusted electronics stores, rated (${YEAR})`;
const DESCRIPTION =
  'Every store we track, at a glance — trust scores, customer ratings, years in business, return windows and warranties. Know who you’re buying from before you pay.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: abs('/stores') },
  openGraph: { type: 'website', title: `${TITLE} · ${SITE_NAME}`, description: DESCRIPTION, url: abs('/stores') },
};

export const revalidate = 300;

function TrustRing({ score }: { score: number }) {
  const color = score >= 75 ? '#1FAE78' : score >= 50 ? '#E8902B' : '#E25555';
  return (
    <span
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #EEF1FB 0deg)` }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white tnum">{score}</span>
    </span>
  );
}

export default async function StoresPage() {
  let sellers: SellerProfileDTO[] = [];
  try {
    sellers = (await getSellers()) as SellerProfileDTO[];
  } catch {
    sellers = [];
  }
  const ranked = [...sellers].sort((a, b) => b.trustScore - a.trustScore);

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <nav className="text-xs text-mut mb-3"><Link href="/" className="text-coral">Home</Link> / Stores</nav>
      <h1 className="font-display text-2xl md:text-3xl font-bold">
        Kenya’s electronics stores, <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">rated</span>
      </h1>
      <p className="text-mut text-sm mt-2 max-w-2xl">
        The cheapest price only matters if the store delivers. Every store we compare is scored on
        customer rating, delivery performance and track record — so you can judge the seller as fast
        as you judge the price.
      </p>

      {ranked.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#E3E6F4] bg-white p-8 text-center text-mut">
          Store profiles are loading — check back shortly.
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ranked.map((s, i) => (
            <div key={s.slug} className="rounded-2xl border border-[#E3E6F4] bg-white p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold truncate">{s.name}</h2>
                    {s.isVerified && <span className="badge bg-mint/15 text-mint shrink-0">✓ Verified</span>}
                    {i === 0 && <span className="badge bg-amber/15 text-amber shrink-0">🏆 Most trusted</span>}
                  </div>
                  <div className="text-xs text-mut mt-1">
                    ★ {s.customerRating.toFixed(1)} rating{s.reviewCount ? ` · ${s.reviewCount} reviews` : ''}
                  </div>
                </div>
                <TrustRing score={s.trustScore} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-[#F4F6FD] p-2">
                  <dt className="text-[#A99FB4] font-bold uppercase text-[9px]">In business</dt>
                  <dd className="font-bold mt-0.5">{s.yearsInBusiness} yrs</dd>
                </div>
                <div className="rounded-xl bg-[#F4F6FD] p-2">
                  <dt className="text-[#A99FB4] font-bold uppercase text-[9px]">Returns</dt>
                  <dd className="font-bold mt-0.5">{s.returnWindowDays ? `${s.returnWindowDays} days` : '—'}</dd>
                </div>
                <div className="rounded-xl bg-[#F4F6FD] p-2">
                  <dt className="text-[#A99FB4] font-bold uppercase text-[9px]">Warranty</dt>
                  <dd className="font-bold mt-0.5 truncate" title={s.warranty ?? undefined}>{s.warranty ? '✓' : '—'}</dd>
                </div>
              </dl>
              {s.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-center rounded-full border-2 border-[#D5DAF0] px-4 py-2 text-xs font-bold hover:border-coral transition"
                >
                  Visit store →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      <AdSlot className="my-6" />
      <p className="text-xs text-[#A99FB4] mt-6">
        Trust scores blend customer ratings, delivery performance and business track record, recomputed daily.
        Ratings come from shopper reviews — <Link href="/contact" className="text-coral">tell us about your experience</Link>.
      </p>
    </div>
  );
}
