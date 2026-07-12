'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProductSummaryDTO } from '@rc/types';
import { search, logEvent } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import BarcodeScanner from '../../components/BarcodeScanner';
import AdSlot from '../../components/AdSlot';

function Results() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [items, setItems] = useState<ProductSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    logEvent('search', { query: q });
    search(`?q=${encodeURIComponent(q)}&pageSize=48`).then((r) => setItems(r.items)).finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="font-display text-xl font-bold">{loading ? 'Searching' : `${items.length} results`} for “{q}”</h1>
        <BarcodeScanner />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="skeleton h-40" />
                <div className="space-y-2 p-4">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-4 w-4/5 rounded" />
                  <div className="skeleton h-5 w-1/2 rounded" />
                </div>
              </div>
            ))
          : items.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
      {!loading && !items.length && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center">
          <div className="text-3xl">🔍</div>
          <p className="mt-2 font-bold">No devices match “{q}”</p>
          <p className="text-mut text-sm mt-1">Try a shorter name — “spark” instead of “tecno spark 40 pro plus”.</p>
        </div>
      )}
      <AdSlot className="my-6" />
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="p-8 text-mut">Loading…</div>}><Results /></Suspense>;
}
