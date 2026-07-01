'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SearchSuggestion } from '@rc/types';
import { autocomplete } from '../lib/api';
import { fmtKES } from '../lib/format';

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sug, setSug] = useState<SearchSuggestion[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setSug([]); return; }
    timer.current = setTimeout(async () => setSug(await autocomplete(q)), 160);
  }, [q]);

  const go = () => { if (q.trim()) { setSug([]); router.push(`/search?q=${encodeURIComponent(q)}`); } };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-page/80 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <b className="hidden text-[15px] font-semibold tracking-tight sm:block">
            Resource Centre
          </b>
        </Link>
        <div className="relative max-w-xl flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="Search products, brands or models…"
            className="input rounded-full"
          />
          {sug.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-50 origin-top animate-scale-in overflow-hidden rounded-2xl border border-line bg-raised shadow-raised">
              {sug.map((s) => (
                <Link
                  key={s.slug}
                  href={`/p/${s.slug}`}
                  onClick={() => setSug([])}
                  className="flex items-center gap-3 border-b border-line px-4 py-3 transition-colors duration-fast ease-out last:border-0 hover:bg-bg2"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-text">{s.name}</span>
                    <span className="text-xs text-muted">{s.category} · {s.brand}</span>
                  </span>
                  <span data-price className="text-sm font-semibold text-text tnum">{fmtKES(s.minPrice)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <nav className="flex shrink-0 items-center gap-5 text-sm font-medium text-muted">
          <Link href="/deals" className="text-accent transition-colors duration-fast ease-out hover:opacity-80">Deals</Link>
          <Link href="/explore" className="hidden transition-colors duration-fast ease-out hover:text-text md:block">Explore</Link>
          <Link href="/releases" className="hidden transition-colors duration-fast ease-out hover:text-text md:block">New &amp; Upcoming</Link>
          <Link href="/phones" className="hidden transition-colors duration-fast ease-out hover:text-text md:block">Phones</Link>
          <Link href="/accessories" className="hidden transition-colors duration-fast ease-out hover:text-text lg:block">Accessories</Link>
          <Link href="/guides" className="hidden transition-colors duration-fast ease-out hover:text-text lg:block">Guides</Link>
          <Link href="/compare" className="transition-colors duration-fast ease-out hover:text-text">Compare</Link>
          <Link href="/alerts" className="hidden transition-colors duration-fast ease-out hover:text-text sm:block">Alerts</Link>
          <Link href="/tip" className="hidden transition-colors duration-fast ease-out hover:text-text sm:block">Tip us</Link>
        </nav>
      </div>
    </header>
  );
}
