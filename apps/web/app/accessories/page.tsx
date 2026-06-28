import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategories } from '../../lib/api';
import { abs } from '../../lib/seo';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Phone accessories in Kenya — earbuds, watches, powerbanks & more',
  description:
    'Shop phone accessories in Kenya: earbuds (earpods), smartwatches, powerbanks, chargers & cables and phone covers. Compare prices across trusted stores.',
  alternates: { canonical: abs('/accessories') },
};

// Category slug -> display + emoji for the hub cards.
const GROUPS: { slug: string; label: string; icon: string; blurb: string }[] = [
  { slug: 'earbuds', label: 'Earbuds / Earpods', icon: '🎧', blurb: 'TWS earbuds from Oraimo, Anker, Samsung, Apple & more.' },
  { slug: 'smart-watches', label: 'Smartwatches', icon: '⌚', blurb: 'Apple Watch, Galaxy Watch, Amazfit, Huawei & budget picks.' },
  { slug: 'powerbanks', label: 'Powerbanks', icon: '🔋', blurb: 'Fast-charging banks from Oraimo, Anker, Xiaomi, UGREEN.' },
  { slug: 'chargers-cables', label: 'Chargers & Cables', icon: '🔌', blurb: 'GaN chargers and durable USB-C cables.' },
  { slug: 'phone-covers', label: 'Phone Covers', icon: '📱', blurb: 'Cases from Spigen, Ringke, Nillkin and everyday covers.' },
];

export default async function AccessoriesHub() {
  const cats = await getCategories().catch(() => []);
  const countBySlug = new Map(cats.map((c) => [c.slug, c.productCount]));

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <nav className="text-xs text-mut mb-3"><Link href="/" className="text-coral">Home</Link> / Phone accessories</nav>
      <h1 className="font-display text-3xl font-bold">Phone accessories</h1>
      <p className="text-mut text-sm max-w-2xl mt-2 mb-6">Everything that goes with your phone — pick a category to compare prices across Kenya’s trusted stores.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUPS.map((g) => (
          <Link key={g.slug} href={`/c/${g.slug}`}
            className="rounded-2xl border border-[#E3E6F4] bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-coral transition">
            <div className="text-3xl">{g.icon}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold">{g.label}</span>
              <span className="text-xs font-bold text-[#A99FB4]">{countBySlug.get(g.slug) ?? 0} items</span>
            </div>
            <p className="text-xs text-mut mt-1">{g.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
