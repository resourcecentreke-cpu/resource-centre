import Link from 'next/link';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';
import { deviceAge } from '../lib/age';
import ProductImage from './ProductImage';

export default function ProductCard({ p }: { p: ProductSummaryDTO }) {
  const age = deviceAge(p.releaseDate);
  return (
    <Link
      href={`/p/${p.slug}`}
      className="card-interactive group block overflow-hidden"
    >
      <div className="relative flex h-40 items-center justify-center bg-bg2 p-4">
        {p.isNew && (
          <span className="badge absolute left-2 top-2 bg-mint/15 text-mint">New</span>
        )}
        {p.specs?.condition === 'Refurbished' && (
          <span className="badge absolute right-2 top-2 bg-amber/15 text-amber">Refurb</span>
        )}
        {age && (
          <span
            className={`badge absolute bottom-2 right-2 ${
              age.isUpcoming
                ? 'bg-accent-soft text-accent'
                : age.isFresh
                  ? 'bg-mint/15 text-mint'
                  : 'bg-bg2 text-muted ring-1 ring-line'
            }`}
            title={age.label}
          >
            {age.isUpcoming ? 'Soon' : age.short}
          </span>
        )}
        <ProductImage
          slug={p.slug}
          fallback={p.image}
          brand={p.brand}
          alt={p.name}
          className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-slow ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-4">
        <div className="eyebrow">{p.category}</div>
        <h4 className="mt-1.5 text-sm font-semibold leading-snug tracking-tight text-text">{p.name}</h4>
        <p className="mt-1 line-clamp-2 min-h-[34px] text-xs leading-relaxed text-muted">{p.specSummary}</p>
        {age && <div className="mt-1 text-2xs font-medium text-faint">{age.label}</div>}
        <div className="mt-3 border-t border-line pt-3">
          <div className="eyebrow">Best price</div>
          <div data-price className="mt-0.5 text-lg font-semibold tracking-tight text-text tnum">{fmtKES(p.minPrice)}</div>
        </div>
      </div>
    </Link>
  );
}
