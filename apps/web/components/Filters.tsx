'use client';
import { useEffect, useState } from 'react';
import type { ProductSummaryDTO } from '@rc/types';
import { getProducts } from '../lib/api';
import ProductCard from './ProductCard';

export default function Filters({ category, initial }: { category: string; initial: ProductSummaryDTO[] }) {
  const [items, setItems] = useState(initial);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState('price_asc');
  const [inStock, setInStock] = useState(false);
  const [newOnly, setNewOnly] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams({ category, sort, pageSize: '48' });
    if (min) qs.set('minPrice', min);
    if (max) qs.set('maxPrice', max);
    if (inStock) qs.set('inStock', 'true');
    if (newOnly) qs.set('isNew', 'true');
    getProducts(`?${qs.toString()}`).then((r) => setItems(r.items)).catch(() => {});
  }, [category, min, max, sort, inStock, newOnly]);

  return (
    <div className="grid md:grid-cols-[230px_1fr] gap-6 items-start">
      <aside className="bg-white border border-[#E3E6F4] rounded-2xl p-4 shadow-sm md:sticky md:top-20">
        <h4 className="text-xs uppercase font-bold text-[#A99FB4] mb-2">Price (KSh)</h4>
        <div className="flex gap-2 mb-4">
          <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="min" type="number" className="w-full border border-[#D5DAF0] rounded-lg p-2 text-xs" />
          <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="max" type="number" className="w-full border border-[#D5DAF0] rounded-lg p-2 text-xs" />
        </div>
        <label className="flex items-center gap-2 text-sm text-mut py-1"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only</label>
        <label className="flex items-center gap-2 text-sm text-mut py-1"><input type="checkbox" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} /> New arrivals</label>
        <h4 className="text-xs uppercase font-bold text-[#A99FB4] mt-4 mb-2">Sort</h4>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border border-[#D5DAF0] rounded-lg p-2 text-sm">
          <option value="price_asc">Price: low → high</option>
          <option value="price_desc">Price: high → low</option>
          <option value="newest">Newest</option>
          <option value="name">Name</option>
        </select>
      </aside>
      <div>
        <p className="text-sm text-mut mb-3">{items.length} devices</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </div>
    </div>
  );
}
