'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Search-first band — replaces the billboard hero. One job: get the shopper
 * to the product or budget they came for in a single interaction.
 * "Most wanted" chips come from live interest analytics; budget chips keep
 * affordability front-and-centre.
 */
const BUDGETS = [
  { label: 'Phones under 16K', href: '/phones/price-11000-15999' },
  { label: 'Under 23K', href: '/phones/price-16000-22999' },
  { label: 'Under 30K', href: '/phones/price-23000-29999' },
  { label: '💻 Laptop chooser', href: '/laptops/chooser' },
  { label: '🔥 Biggest drops', href: '/deals' },
];

export default function SearchBand({ mostWanted }: { mostWanted: { name: string; slug: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <section className="pt-8 pb-6 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" /> Live prices across Kenya’s trusted stores
      </span>
      <h1 className="mt-3 font-display text-2xl md:text-4xl font-bold tracking-tight">
        Find it. Compare it. <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">Never overpay.</span>
      </h1>

      <form onSubmit={submit} className="mx-auto mt-5 flex max-w-2xl items-center gap-1.5 rounded-full border-2 border-text bg-surface p-1 pl-5 shadow-soft">
        <span className="text-muted text-lg" aria-hidden>⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a phone, TV, laptop, fridge…"
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-faint"
        />
        <button type="submit" className="shrink-0 rounded-full bg-text px-6 py-2.5 text-sm font-bold text-surface active:scale-95 transition-transform">
          Search
        </button>
      </form>

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {BUDGETS.map((b) => (
          <Link key={b.href} href={b.href} className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-bold transition hover:border-text hover:-translate-y-px">
            {b.label}
          </Link>
        ))}
      </div>

      {mostWanted.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          <span className="font-bold text-faint uppercase tracking-wide text-2xs">Most wanted:</span>{' '}
          {mostWanted.slice(0, 5).map((m, i) => (
            <span key={m.slug}>
              {i > 0 && ' · '}
              <Link href={`/p/${m.slug}`} className="font-semibold text-text hover:text-accent">{m.name}</Link>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
