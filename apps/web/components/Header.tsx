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
    <header className="sticky top-0 z-50 backdrop-blur bg-[#FFFDF9]/85 border-b border-[#F1E7DC]">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-coral" /><span className="w-2 h-2 rounded-full bg-amber" /><span className="w-2 h-2 rounded-full bg-mint" />
          </span>
          <b className="hidden sm:block">Resource Centre</b>
        </Link>
        <div className="flex-1 relative max-w-xl">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="Search products, brands or models…"
            className="w-full border-2 border-[#E7DACd] rounded-full px-4 py-2 text-sm outline-none focus:border-coral" />
          {sug.length > 0 && (
            <div className="absolute top-11 left-0 right-0 bg-white border border-[#F1E7DC] rounded-2xl shadow-xl overflow-hidden z-50">
              {sug.map((s) => (
                <Link key={s.slug} href={`/p/${s.slug}`} onClick={() => setSug([])}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF4EC] border-b border-[#F1E7DC] last:border-0">
                  <span className="flex-1"><span className="font-semibold text-sm block">{s.name}</span><span className="text-xs text-mut">{s.category} · {s.brand}</span></span>
                  <span className="text-coral font-bold text-sm">{fmtKES(s.minPrice)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <nav className="flex gap-4 items-center shrink-0 text-sm font-semibold text-mut">
          <Link href="/deals" className="hover:text-coral text-coral">🔥 Deals</Link>
          <Link href="/compare" className="hover:text-ink">Compare</Link>
          <Link href="/alerts" className="hover:text-ink hidden sm:block">Alerts</Link>
          <Link href="/tip" className="hover:text-coral hidden sm:block">💛 Tip us</Link>
        </nav>
      </div>
    </header>
  );
}
