'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fmtKES } from '../lib/format';

export interface RecentItem {
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

const KEY = 'rc_recent_v1';

export function readRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(arr) ? arr.filter((x) => x && x.slug && x.name) : [];
  } catch {
    return [];
  }
}

/** Drop-in for product pages: records the visit, renders nothing. */
export function RecentTracker({ item }: { item: RecentItem }) {
  useEffect(() => {
    try {
      const next = [item, ...readRecent().filter((x) => x.slug !== item.slug)].slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* storage unavailable — fine */ }
  }, [item]);
  return null;
}

/** Homepage rail: "Pick up where you left off" — returning shoppers convert. */
export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => setItems(readRecent()), []);
  if (items.length < 2) return null;

  return (
    <section className="pb-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-bold tracking-tight">Pick up where you left off</h2>
        <span className="text-xs text-muted">Only stored on this device</span>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <Link
            key={it.slug}
            href={`/p/${it.slug}`}
            className="card-interactive flex w-40 shrink-0 snap-start flex-col overflow-hidden"
          >
            <span className="flex h-24 items-center justify-center bg-bg2 p-2">
              {it.image
                ? <img src={it.image} alt={it.name} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
                : <span className="text-xs text-muted">{it.name.split(' ')[0]}</span>}
            </span>
            <span className="p-3">
              <span className="block truncate text-xs font-semibold">{it.name}</span>
              <span data-price className="mt-0.5 block text-sm font-bold text-text tnum">{fmtKES(it.price)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
