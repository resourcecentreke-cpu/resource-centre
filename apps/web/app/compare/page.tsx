'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductDetailDTO } from '@rc/types';
import { getProduct } from '../../lib/api';
import { getCompare, toggleCompare } from '../../lib/compare';
import { fmtKES } from '../../lib/format';

export default function ComparePage() {
  const [products, setProducts] = useState<ProductDetailDTO[]>([]);

  const load = () => {
    Promise.all(getCompare().map((s) => getProduct(s).catch(() => null)))
      .then((list) => setProducts(list.filter(Boolean) as ProductDetailDTO[]));
  };
  useEffect(() => { load(); window.addEventListener('rc-compare', load); return () => window.removeEventListener('rc-compare', load); }, []);

  if (!products.length) return (
    <div className="max-w-4xl mx-auto px-5 py-16 text-center">
      <h1 className="font-display text-2xl font-bold mb-2">Compare devices</h1>
      <p className="text-mut">No devices yet. Add some with the “Compare” button on any product.</p>
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
      <div className="overflow-x-auto rounded-2xl border border-[#F1E7DC] bg-white">
        <table className="w-full text-sm min-w-[600px]">
          <thead><tr><th className="p-3"></th>{products.map((p) => (
            <th key={p.slug} className="p-3 text-center">
              {p.image && <img src={p.image} alt="" className="h-16 mx-auto object-contain" />}
              <Link href={`/p/${p.slug}`} className="font-bold block mt-1">{p.name}</Link>
              <button onClick={() => toggleCompare(p.slug)} className="text-xs text-[#E25555] mt-1">✕ remove</button>
            </th>
          ))}</tr></thead>
          <tbody>
            {rows.map(([label, render, score]) => {
              const wi = winner(score);
              return (
                <tr key={label} className="border-t border-[#F1E7DC]">
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
    </div>
  );
}
