import Link from 'next/link';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

export default function ProductCard({ p }: { p: ProductSummaryDTO }) {
  return (
    <Link href={`/p/${p.slug}`}
      className="group block rounded-2xl border border-[#F1E7DC] bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition">
      <div className="h-40 flex items-center justify-center p-4 bg-gradient-to-b from-white to-[#FFF7F0] relative">
        {p.isNew && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint/20 text-[#0e8f68]">NEW</span>}
        {p.image
          ? <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain drop-shadow" />
          : <div className="text-mut text-xs">{p.brand}</div>}
      </div>
      <div className="p-3.5">
        <div className="text-[10px] uppercase tracking-wide text-[#A99FB4] font-bold">{p.category}</div>
        <h4 className="font-bold text-sm mt-1 leading-tight">{p.name}</h4>
        <p className="text-[11px] text-mut mt-1 line-clamp-2 min-h-[30px]">{p.specSummary}</p>
        <div className="mt-2 pt-2 border-t border-[#F1E7DC]">
          <div className="text-[10px] text-[#A99FB4] font-bold uppercase">Best price</div>
          <div className="font-bold text-lg">{fmtKES(p.minPrice)}</div>
        </div>
      </div>
    </Link>
  );
}
