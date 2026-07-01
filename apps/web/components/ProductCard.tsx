import Link from 'next/link';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';
import { deviceAge } from '../lib/age';
import ProductImage from './ProductImage';
import AlertBell from './AlertBell';

/**
 * THE product card — one template reused everywhere (deals, top 10, arrivals,
 * category pages): image, name, 1–2 key specs, price, price-trend arrow, and a
 * one-click price alert. Optional `rank` renders a Top-10 badge; optional
 * `drop` renders the trend arrow + previous price.
 */
export default function ProductCard({
  p,
  rank,
  drop,
}: {
  p: ProductSummaryDTO;
  rank?: number;
  drop?: { pct: number; previous: number };
}) {
  const age = deviceAge(p.releaseDate);
  const keySpecs = (p.specSummary || '')
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');

  return (
    <Link
      href={`/p/${p.slug}`}
      className="card-interactive group block overflow-hidden"
    >
      <div className="relative flex h-40 items-center justify-center bg-bg2 p-4">
        {typeof rank === 'number' && (
          <span
            className={`absolute left-2 top-2 z-[1] inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              rank <= 3 ? 'bg-accent text-white' : 'bg-surface text-muted ring-1 ring-line'
            }`}
          >
            {rank}
          </span>
        )}
        {rank === undefined && p.isNew && (
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
        {keySpecs && (
          <p className="mt-1 line-clamp-1 min-h-[18px] text-xs leading-relaxed text-muted">{keySpecs}</p>
        )}
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-line pt-3">
          <div className="min-w-0">
            <div className="eyebrow">Best price</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span data-price className="text-lg font-semibold tracking-tight text-text tnum">
                {fmtKES(p.minPrice)}
              </span>
              {drop && (
                <>
                  <span className="text-xs font-bold text-mint">↓ {drop.pct}%</span>
                  <span className="text-xs text-faint line-through tnum">{fmtKES(drop.previous)}</span>
                </>
              )}
            </div>
          </div>
          <AlertBell slug={p.slug} price={p.minPrice} />
        </div>
      </div>
    </Link>
  );
}
