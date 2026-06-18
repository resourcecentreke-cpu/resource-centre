import Link from 'next/link';
import type { TopInterestDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * GSM-Arena-style "Top 10 by interest" widget. Renders a compact ranked list
 * with a relative interest bar. `title` and the items are passed in by the
 * server component so this stays a pure presentational component.
 */
export default function TopInterest({
  items,
  title = 'Top 10 by interest',
  subtitle,
}: {
  items: TopInterestDTO[];
  title?: string;
  subtitle?: string;
}) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((p) => p.interest), 1);

  return (
    <aside className="rounded-2xl border border-[#F1E7DC] bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-coral to-amber text-white">
        <h3 className="font-display font-bold text-sm flex items-center gap-2">📈 {title}</h3>
        {subtitle && <p className="text-[11px] text-white/85 mt-0.5">{subtitle}</p>}
      </div>
      <ol className="divide-y divide-[#F6EEE5]">
        {items.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/p/${p.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FFF7F0] transition"
            >
              <span
                className={`w-6 text-center font-display font-bold text-sm shrink-0 ${
                  p.rank <= 3 ? 'text-coral' : 'text-[#C9BEB2]'
                }`}
              >
                {p.rank}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-[13px] leading-tight truncate">{p.name}</span>
                <span className="mt-1 block h-1.5 rounded-full bg-[#F1E7DC] overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-coral to-amber"
                    style={{ width: `${Math.max(8, Math.round((p.interest / max) * 100))}%` }}
                  />
                </span>
              </span>
              <span className="text-coral font-bold text-[12px] shrink-0">{fmtKES(p.minPrice)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
