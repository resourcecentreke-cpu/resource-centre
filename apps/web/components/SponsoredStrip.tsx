import Link from 'next/link';
import type { SponsoredListingDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * Paid placements strip. Renders nothing when no campaign is live, so it
 * costs zero space until a seller buys a slot. Every card is clearly
 * labelled "Sponsored" (required for ad disclosure).
 */
export default function SponsoredStrip({ items, title = 'Sponsored' }: { items: SponsoredListingDTO[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="pb-8">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        <span className="text-[10px] uppercase tracking-wide font-bold text-[#A99FB4]">Paid placement</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((s) => {
          const inner = (
            <>
              <span className="absolute top-2 right-2 rounded-full bg-amber/20 text-[#9a6a12] text-[9px] font-bold uppercase tracking-wide px-2 py-0.5">Sponsored</span>
              <div className="h-20 flex items-center justify-center">
                {s.product?.image
                  ? <img src={s.product.image} alt={s.product.name} loading="lazy" decoding="async" className="max-h-full max-w-[80%] object-contain" />
                  : <span className="text-2xl">🏪</span>}
              </div>
              <div className="mt-2 font-bold text-xs leading-snug line-clamp-2">{s.product?.name ?? s.sellerName}</div>
              {s.product
                ? <div className="text-coral font-bold text-xs mt-1">{fmtKES(s.product.minPrice)}</div>
                : <div className="text-[11px] text-mut mt-1">Visit store</div>}
              <div className="text-[10px] text-[#A99FB4] mt-0.5">by {s.sellerName}</div>
            </>
          );
          const cls = 'relative rounded-2xl border border-amber/40 bg-white p-3 hover:-translate-y-1 hover:shadow-md transition block';
          return s.product ? (
            <Link key={s.id} href={`/p/${s.product.slug}`} className={cls}>{inner}</Link>
          ) : (
            <a key={s.id} href={s.sellerWebsite ?? '#'} target="_blank" rel="noopener sponsored noreferrer" className={cls}>{inner}</a>
          );
        })}
      </div>
    </section>
  );
}
