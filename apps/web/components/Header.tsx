'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SearchSuggestion } from '@rc/types';
import { autocomplete } from '../lib/api';
import { fmtKES } from '../lib/format';
import Logo from './Logo';

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sug, setSug] = useState<SearchSuggestion[]>([]);
  const [active, setActive] = useState(-1); // keyboard-highlighted suggestion
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setSug([]); setActive(-1); return; }
    timer.current = setTimeout(async () => { setSug(await autocomplete(q)); setActive(-1); }, 160);
  }, [q]);

  const close = () => { setSug([]); setActive(-1); };
  const go = () => { if (q.trim()) { close(); router.push(`/search?q=${encodeURIComponent(q)}`); } };

  // Apple-style keyboard flow: up/down move, Enter opens, Esc dismisses.
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { close(); return; }
    if (!sug.length) { if (e.key === 'Enter') go(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((v) => (v + 1) % sug.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((v) => (v <= 0 ? sug.length - 1 : v - 1)); }
    else if (e.key === 'Enter') {
      const pick = active >= 0 ? sug[active] : null;
      if (pick) { close(); router.push(`/p/${pick.slug}`); } else go();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0F]/90 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo dark size={30} withWordmark className="[&>span]:hidden sm:[&>span]:block" />
        </Link>
        <div className="relative max-w-xl flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setTimeout(close, 150)}
            role="combobox"
            aria-expanded={sug.length > 0}
            aria-autocomplete="list"
            placeholder="Search products, brands or models…"
            className="w-full rounded-full border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm text-white placeholder:text-white/40 transition duration-fast ease-out focus:border-white/40 focus-visible:shadow-none"
          />
          {sug.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-50 origin-top animate-scale-in overflow-hidden rounded-2xl border border-line bg-raised shadow-raised">
              {sug.map((s, i) => (
                <Link
                  key={s.slug}
                  href={`/p/${s.slug}`}
                  onClick={close}
                  className={`flex items-center gap-3 border-b border-line px-4 py-3 transition-colors duration-fast ease-out last:border-0 hover:bg-bg2 ${i === active ? 'bg-bg2' : ''}`}
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
        <nav className="flex shrink-0 items-center gap-5 text-sm font-medium text-white/55">
          <Link href="/deals" className="font-semibold text-[#2FD3A5] transition-colors duration-fast ease-out hover:opacity-80">Deals</Link>
          <Link href="/explore" className="hidden transition-colors duration-fast ease-out hover:text-white md:block">Explore</Link>
          <Link href="/releases" className="hidden transition-colors duration-fast ease-out hover:text-white md:block">New &amp; Upcoming</Link>
          <Link href="/phones" className="hidden transition-colors duration-fast ease-out hover:text-white md:block">Phones</Link>
          <Link href="/accessories" className="hidden transition-colors duration-fast ease-out hover:text-white lg:block">Accessories</Link>
          <Link href="/guides" className="hidden transition-colors duration-fast ease-out hover:text-white lg:block">Guides</Link>
          <Link href="/stores" className="hidden transition-colors duration-fast ease-out hover:text-white md:block">Stores</Link>
          <Link href="/compare" className="transition-colors duration-fast ease-out hover:text-white">Compare</Link>
          <Link href="/alerts" className="hidden transition-colors duration-fast ease-out hover:text-white sm:block">Alerts</Link>
          <Link href="/tip" className="hidden transition-colors duration-fast ease-out hover:text-white sm:block">Tip us</Link>
        </nav>
      </div>
    </header>
  );
}
