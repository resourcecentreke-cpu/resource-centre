import type { Metadata } from 'next';
import Link from 'next/link';
import { listGuides } from '../../lib/guides';
import { abs, SITE_NAME } from '../../lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buying guides — smart electronics shopping in Kenya',
  description: `Practical buying guides from ${SITE_NAME}: how to choose phones, laptops, TVs and appliances in Kenya, and how to pay the lowest price.`,
  alternates: { canonical: abs('/guides') },
};

export default function GuidesPage() {
  const guides = listGuides();
  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <nav className="text-xs text-mut mb-3"><Link href="/" className="text-coral">Home</Link> / Guides</nav>
      <h1 className="font-display text-3xl md:text-4xl font-bold">Buying guides</h1>
      <p className="text-mut mt-2 max-w-2xl">Honest, practical advice for buying electronics in Kenya — what matters, what to skip, and how to find the best price.</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        {guides.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`}
            className="block rounded-2xl border border-[#E3E6F4] bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-coral transition">
            {g.category && <div className="text-[10px] uppercase tracking-wide text-[#A99FB4] font-bold">{g.category}</div>}
            <h2 className="font-display text-lg font-bold mt-1 leading-snug">{g.title}</h2>
            <p className="text-sm text-mut mt-1">{g.description}</p>
            <span className="text-coral font-semibold text-sm mt-2 inline-block">Read guide →</span>
          </Link>
        ))}
      </div>
      {guides.length === 0 && <p className="text-mut mt-8">Guides are coming soon.</p>}
    </div>
  );
}
