import type { Metadata } from 'next';
import Link from 'next/link';
import type { ProductSummaryDTO } from '@rc/types';
import { getProducts } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import { deviceAge } from '../../lib/age';
import { abs, SITE_NAME } from '../../lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'New & Upcoming Phone Releases in Kenya',
  description:
    'The newest phones from the global brands with live Kenyan retail prices and how old each device is — plus the expected upcoming releases to wait for.',
  alternates: { canonical: abs('/releases') },
  openGraph: { title: `New & Upcoming Releases · ${SITE_NAME}`, url: abs('/releases'), type: 'website' },
};

// Curated upcoming / expected devices. Dates are best-estimate launch windows —
// edit here as official dates are confirmed.
const UPCOMING: { name: string; brand: string; expected: string; note: string }[] = [
  { name: 'Samsung Galaxy Z Fold8 / Flip8', brand: 'Samsung', expected: '2026-07', note: 'Next-gen foldables' },
  { name: 'Google Pixel 11 / 11 Pro', brand: 'Google', expected: '2026-08', note: 'Tensor G6, AI-first' },
  { name: 'Apple iPhone 18 / 18 Pro', brand: 'Apple', expected: '2026-09', note: 'A20 Pro chipset' },
  { name: 'OnePlus 16', brand: 'OnePlus', expected: '2026-10', note: 'Snapdragon flagship' },
  { name: 'Xiaomi 17 Ultra', brand: 'Xiaomi', expected: '2026-10', note: 'Leica camera system' },
  { name: 'Nothing Phone (4)', brand: 'Nothing', expected: '2026-09', note: 'Glyph design refresh' },
  { name: 'Samsung Galaxy S27 Ultra', brand: 'Samsung', expected: '2027-01', note: '200MP, S Pen' },
  { name: 'Oppo Find X10 Pro', brand: 'Oppo', expected: '2026-11', note: 'Hasselblad optics' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function expectedLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export default async function ReleasesPage() {
  // Page through the catalogue to collect everything with a release date.
  const all: ProductSummaryDTO[] = [];
  for (let page = 1; page <= 4; page++) {
    try {
      const res = await getProducts(`?pageSize=120&page=${page}`);
      all.push(...res.items);
      if (page >= (res.totalPages || 1)) break;
    } catch {
      break;
    }
  }

  const now = new Date();
  const released = all
    .filter((p) => p.releaseDate && new Date(p.releaseDate) <= now)
    .sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime());

  const justLanded = released.filter((p) => (deviceAge(p.releaseDate)?.months ?? 99) <= 3).slice(0, 12);
  const latest = released.slice(0, 24);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <nav className="text-xs text-mut mb-3"><Link href="/" className="text-coral">Home</Link> / Releases</nav>
      <h1 className="font-display text-3xl md:text-4xl font-bold">New &amp; upcoming releases</h1>
      <p className="text-mut text-sm max-w-2xl mt-2">
        The latest devices from the global brands — with live Kenyan retail prices and exactly how old each one is —
        plus what&apos;s expected next. Like GSM Arena, but priced for Kenya.
      </p>

      {justLanded.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🆕</span>
            <h2 className="font-display text-xl font-bold">Just landed</h2>
            <span className="text-xs font-bold text-[#0e8f68] bg-mint/20 px-2 py-0.5 rounded-full">released ≤ 3 months ago</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {justLanded.map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📅</span>
          <h2 className="font-display text-xl font-bold">Latest releases</h2>
          <span className="text-xs text-mut">newest first, with device age</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {latest.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⏳</span>
          <h2 className="font-display text-xl font-bold">Coming soon — expected releases</h2>
        </div>
        <p className="text-mut text-sm mb-4">Devices on the horizon. Dates are estimated launch windows; set a price alert and we&apos;ll track them once they land in Kenya.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {UPCOMING.map((u) => (
            <div key={u.name} className="rounded-2xl border border-coral/25 bg-gradient-to-br from-[#EEF1FB] to-[#F4F6FD] p-4 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide font-bold text-[#A99FB4]">{u.brand}</span>
                <span className="text-[10px] font-bold text-coral bg-white px-2 py-0.5 rounded-full border border-coral/30">Expected {expectedLabel(u.expected)}</span>
              </div>
              <div className="font-bold text-sm mt-2 leading-tight">{u.name}</div>
              <div className="text-[11px] text-mut mt-1 flex-1">{u.note}</div>
              <Link href="/alerts" className="mt-3 text-xs font-bold text-coral hover:underline">🔔 Notify me when it lands →</Link>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 rounded-2xl border border-[#E3E6F4] bg-white p-5 text-sm text-mut">
        <b className="text-ink">How device age works:</b> each card shows how long since the device launched — “2 months old”, “1 year old”, and so on — so you can weigh a newer model against a cheaper, slightly older one. <Link href="/phones" className="text-coral font-semibold">Browse all phones →</Link>
      </div>
    </div>
  );
}
