'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ProductDetailDTO, TopInterestDTO } from '@rc/types';
import { getProduct, getTopInterest } from '../../lib/api';
import { getCompare, toggleCompare, setCompare } from '../../lib/compare';
import { fmtKES } from '../../lib/format';

/**
 * The internet's most-compared matchups (GSMArena/Kimovil-style), curated to
 * models in our catalogue. Pairs that aren't in the catalogue are hidden
 * automatically, so this list stays safe as products come and go.
 */
const FAMOUS_PAIRS: [string, string][] = [
  ['iphone-17-pro-max', 'samsung-galaxy-s25-ultra'],
  ['iphone-17', 'samsung-galaxy-s25-plus'],
  ['samsung-galaxy-s24-fe', 'google-pixel-9'],
  ['tecno-spark-40-pro-plus', 'infinix-hot-60-pro-plus'],
  ['tecno-pova-7-pro-5g', 'infinix-note-50-pro'],
  ['samsung-galaxy-a17-5g', 'xiaomi-redmi-15'],
  ['tecno-camon-40-pro-5g', 'infinix-note-50-pro-plus-5g'],
  ['xiaomi-15-ultra', 'samsung-galaxy-s25-ultra'],
];

interface Pair { a: { slug: string; name: string }; b: { slug: string; name: string } }

function PopularComparisons({ onPick }: { onPick: (a: string, b: string) => void }) {
  const [pairs, setPairs] = useState<Pair[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Validate the famous pairs against the live catalogue (missing → hidden)…
      const slugs = [...new Set(FAMOUS_PAIRS.flat())];
      const found = new Map<string, string>();
      await Promise.all(
        slugs.map(async (slug) => {
          try {
            const p = await getProduct(slug);
            found.set(slug, p.name);
          } catch { /* not in catalogue */ }
        }),
      );
      const famous: Pair[] = FAMOUS_PAIRS
        .filter(([a, b]) => found.has(a) && found.has(b))
        .map(([a, b]) => ({ a: { slug: a, name: found.get(a)! }, b: { slug: b, name: found.get(b)! } }));

      // …and top it up with live rivalry pairs from Kenya's interest ranking
      // (neighbouring ranks = same budget = what people actually cross-shop).
      let ranked: TopInterestDTO[] = [];
      try { ranked = await getTopInterest('smartphones', 10); } catch { /* fine */ }
      const dynamic: Pair[] = [];
      for (let i = 0; i + 1 < ranked.length && dynamic.length < 3; i += 2) {
        const a = ranked[i]!, b = ranked[i + 1]!;
        const dup = famous.some((f) =>
          [f.a.slug, f.b.slug].includes(a.slug) && [f.a.slug, f.b.slug].includes(b.slug));
        if (!dup) dynamic.push({ a: { slug: a.slug, name: a.name }, b: { slug: b.slug, name: b.name } });
      }

      if (!cancelled) setPairs([...famous, ...dynamic].slice(0, 8));
    })();
    return () => { cancelled = true; };
  }, []);

  if (!pairs.length) return null;
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-bold">🔥 Most-compared phones</h2>
      <p className="text-mut text-xs mt-0.5">The matchups shoppers look up the most — one tap to see them side by side.</p>
      <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
        {pairs.map((p) => (
          <button
            key={`${p.a.slug}-${p.b.slug}`}
            onClick={() => onPick(p.a.slug, p.b.slug)}
            className="rounded-full border border-[#D5DAF0] bg-white px-4 py-2 text-xs font-bold hover:border-coral hover:-translate-y-px transition"
          >
            {p.a.name} <span className="text-coral">vs</span> {p.b.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompareInner() {
  const params = useSearchParams();
  const [products, setProducts] = useState<ProductDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all(getCompare().map((s) => getProduct(s).catch(() => null)))
      .then((list) => setProducts(list.filter(Boolean) as ProductDetailDTO[]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Deep links: /compare?a=<slug>&b=<slug> preloads a matchup (used by shares).
    const a = params.get('a'), b = params.get('b');
    if (a && b) setCompare([a, b]);
    load();
    window.addEventListener('rc-compare', load);
    return () => window.removeEventListener('rc-compare', load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (a: string, b: string) => { setLoading(true); setCompare([a, b]); };

  if (!products.length) return (
    <div className="max-w-4xl mx-auto px-5 py-16 text-center">
      <h1 className="font-display text-2xl font-bold mb-2">Compare devices</h1>
      <p className="text-mut">
        {loading ? 'Loading…' : 'No devices yet. Add some with the “Compare” button on any product — or start from a popular matchup:'}
      </p>
      <PopularComparisons onPick={pick} />
    </div>
  );

  const rows: [string, (p: ProductDetailDTO) => string, (p: ProductDetailDTO) => number][] = [
    ['Best price', (p) => fmtKES(p.minPrice), (p) => -p.minPrice],
    ['Best store', (p) => p.bestSeller ?? '—', () => 0],
    ['Stores', (p) => String(p.offerCount), (p) => p.offerCount],
    ['Lowest ever', (p) => fmtKES(p.priceStats.lowest), (p) => -p.priceStats.lowest],
    ['Discount', (p) => `${p.priceStats.discountPct}%`, (p) => p.priceStats.discountPct],
  ];
  const winner = (score: (p: ProductDetailDTO) => number) => {
    let bi = -1, bv = -Infinity;
    products.forEach((p, i) => { const v = score(p); if (v > bv) { bv = v; bi = i; } });
    return bi;
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <h1 className="font-display text-2xl font-bold mb-4">Compare devices</h1>
      <div className="overflow-x-auto rounded-2xl border border-[#E3E6F4] bg-white">
        <table className="w-full text-sm min-w-[600px]">
          <thead><tr><th className="p-3"></th>{products.map((p) => (
            <th key={p.slug} className="p-3 text-center">
              {p.image && <img src={p.image} alt="" loading="lazy" decoding="async" className="h-16 mx-auto object-contain" />}
              <Link href={`/p/${p.slug}`} className="font-bold block mt-1">{p.name}</Link>
              <button onClick={() => toggleCompare(p.slug)} className="text-xs text-[#E25555] mt-1">✕ remove</button>
            </th>
          ))}</tr></thead>
          <tbody>
            {rows.map(([label, render, score]) => {
              const wi = winner(score);
              return (
                <tr key={label} className="border-t border-[#E3E6F4]">
                  <td className="p-3 font-bold text-[11px] uppercase text-[#A99FB4]">{label}</td>
                  {products.map((p, i) => (
                    <td key={p.slug} className={`p-3 text-center ${i === wi ? 'bg-mint/15 font-bold' : ''}`}>{render(p)}{i === wi ? ' 🏆' : ''}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PopularComparisons onPick={pick} />
    </div>
  );
}

export default function ComparePage() {
  return <Suspense fallback={<div className="p-8 text-center text-mut">Loading…</div>}><CompareInner /></Suspense>;
}
