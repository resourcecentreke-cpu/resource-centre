import Link from 'next/link';
import type { DealDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * Live price-drop strip — the loss-aversion hook, surfaced right under the
 * hero instead of buried as a feature icon. Server-rendered from /deals data.
 */
export default function PriceDropTicker({ deals }: { deals: DealDTO[] }) {
  if (!deals.length) return null;
  const top = deals.slice(0, 3);
  return (
    <Link
      href="/deals"
      className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-mint/25 bg-mint/[0.07] px-4 py-3 transition duration-fast ease-out hover:border-mint/40"
    >
      <span className="shrink-0 text-base" aria-hidden>🔥</span>
      <span className="shrink-0 text-sm font-bold text-text">
        {deals.length} {deals.length === 1 ? 'device' : 'devices'} just dropped in price
      </span>
      <span className="hidden min-w-0 flex-1 items-center gap-4 truncate text-xs text-muted sm:flex">
        {top.map((d) => (
          <span key={d.slug} className="truncate">
            {d.name} <b className="text-mint">−{d.dropPct}%</b>{' '}
            <span className="tnum">{fmtKES(d.currentPrice)}</span>
          </span>
        ))}
      </span>
      <span className="shrink-0 text-sm font-semibold text-mint group-hover:underline">
        See all →
      </span>
    </Link>
  );
}
