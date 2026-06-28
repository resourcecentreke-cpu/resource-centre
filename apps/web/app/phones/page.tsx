import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts, getTopInterest } from '../../lib/api';
import { PHONE_TIERS, PHONE_BANDS } from '../../lib/phoneTiers';
import { fmtKES } from '../../lib/format';
import TopInterest from '../../components/TopInterest';
import { abs, SITE_NAME } from '../../lib/seo';

export const revalidate = 120;
const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Phones in Kenya by tier & price (${YEAR})`,
  description:
    'Browse phones in Kenya by tier — Flagship, Upper Midrange, Midrange, Lower Midrange and Budget — or by exact price band. Compare prices across trusted stores.',
  alternates: { canonical: abs('/phones') },
};

async function countFor(min: number, max: number | null) {
  const qs = `?category=smartphones&minPrice=${min}${max ? `&maxPrice=${max}` : ''}&pageSize=1`;
  try {
    return (await getProducts(qs)).total;
  } catch {
    return 0;
  }
}

export default async function PhonesHub() {
  const [tierCounts, bandCounts, top] = await Promise.all([
    Promise.all(PHONE_TIERS.map((t) => countFor(t.min, t.max))),
    Promise.all(PHONE_BANDS.map((b) => countFor(b.min, b.max))),
    getTopInterest('smartphones', 10).catch(() => []),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <nav className="text-xs text-mut mb-3"><Link href="/" className="text-coral">Home</Link> / Phones</nav>
      <h1 className="font-display text-3xl font-bold">Phones in Kenya <span className="text-base font-normal text-mut">({YEAR})</span></h1>
      <p className="text-mut text-sm max-w-2xl mt-2">Pick a tier or an exact price band — each opens a filtered listing you can compare across Kenya’s trusted stores.</p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start mt-6">
        <div>
          <h2 className="font-display text-xl font-bold mb-3">By tier</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PHONE_TIERS.map((t, i) => (
              <Link key={t.slug} href={`/phones/${t.slug}`}
                className="rounded-2xl border border-[#E3E6F4] bg-white p-4 shadow-sm hover:-translate-y-1 hover:border-coral transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{t.label}</span>
                  <span className="text-xs font-bold text-[#A99FB4]">{tierCounts[i]} phones</span>
                </div>
                <p className="text-xs text-mut mt-1">{t.blurb}</p>
                <div className="text-[11px] text-coral font-bold mt-2">{t.max ? `${fmtKES(t.min)} – ${fmtKES(t.max)}` : `${fmtKES(t.min)}+`}</div>
              </Link>
            ))}
          </div>

          <h2 className="font-display text-xl font-bold mt-8 mb-3">By price band</h2>
          <div className="flex flex-wrap gap-2">
            {PHONE_BANDS.map((b, i) => (
              <Link key={b.slug} href={`/phones/${b.slug}`}
                className="rounded-full border-2 border-[#D5DAF0] bg-white px-4 py-2 text-sm font-bold hover:border-coral transition">
                {b.label} <span className="text-[#A99FB4] font-normal">· {bandCounts[i]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-20">
          <TopInterest items={top} title="Top 10 phones in Kenya" subtitle="Ranked by shopper interest" />
        </div>
      </div>
    </div>
  );
}
