'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProductSummaryDTO } from '@rc/types';
import { search, logEvent } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import BarcodeScanner from '../../components/BarcodeScanner';

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
        {items.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>
      {!loading && !items.length && <p className="text-mut">No devices match “{q}”.</p>}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="p-8 text-mut">Loading…</div>}><Results /></Suspense>;
}
