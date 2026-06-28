'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ProductSummaryDTO } from '@rc/types';
import { getProducts } from '../../../lib/api';
import { fmtKES } from '../../../lib/format';

type UseCase = 'student' | 'everyday' | 'business' | 'programming' | 'design' | 'gaming';
const USE_CASES: { id: UseCase; label: string; icon: string; desc: string }[] = [
  { id: 'student', label: 'Student', icon: '🎓', desc: 'Notes, browsing, video calls, light apps' },
  { id: 'everyday', label: 'Everyday', icon: '🏠', desc: 'Web, office, streaming, family use' },
  { id: 'business', label: 'Business', icon: '💼', desc: 'Office, meetings, portability, security' },
  { id: 'programming', label: 'Programming', icon: '⌨️', desc: 'Coding, VMs, lots of RAM & cores' },
  { id: 'design', label: 'Design / Creative', icon: '🎨', desc: 'Photo/video, colour-accurate screens' },
  { id: 'gaming', label: 'Gaming', icon: '🎮', desc: 'Dedicated GPU, high refresh rate' },
];

type Condition = 'any' | 'New' | 'Refurbished';
const BUDGETS = [40000, 60000, 80000, 120000, 200000, 400000];

export default function LaptopChooser() {
  const [all, setAll] = useState<ProductSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [useCase, setUseCase] = useState<UseCase>('everyday');
  const [budget, setBudget] = useState(80000);
  const [condition, setCondition] = useState<Condition>('any');

  useEffect(() => {
    getProducts('?category=laptops&pageSize=120&sort=price_asc')
      .then((r) => setAll(r.items))
      .finally(() => setLoading(false));
  }, []);

  const picks = useMemo(() => {
    const matches = all.filter((p) => {
      const s = (p.specs ?? {}) as { useCases?: string[]; condition?: string };
      const cond = s.condition ?? 'New';
      if (condition !== 'any' && cond !== condition) return false;
      if (p.minPrice > budget) return false;
      return (s.useCases ?? []).includes(useCase);
    });
    // Rank: prefer pricier within budget (more capable) but reward value; newest first as tiebreak.
    return matches
      .map((p) => ({ p, score: p.minPrice + (p.isNew ? 4000 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.p);
  }, [all, useCase, budget, condition]);

  const reason = (p: ProductSummaryDTO) => {
    const uc = USE_CASES.find((u) => u.id === useCase)!;
    const s = (p.specs ?? {}) as { condition?: string; battery?: string; cycles?: number };
    const bits = [`great for ${uc.label.toLowerCase()}`];
    if (s.condition === 'Refurbished') bits.push(`refurbished — battery ${s.battery ?? 'tested'}${typeof s.cycles === 'number' ? `, ${s.cycles} cycles` : ''}`);
    bits.push(`within your ${fmtKES(budget)} budget`);
    return bits.join(' · ');
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <nav className="text-xs text-mut mb-3"><Link href="/" className="text-coral">Home</Link> / <Link href="/c/laptops" className="text-coral">Laptops</Link> / Chooser</nav>
      <h1 className="font-display text-3xl font-bold">Find the right laptop</h1>
      <p className="text-mut text-sm max-w-2xl mt-2 mb-6">Tell us how you’ll use it and your budget — we’ll suggest laptops from our catalogue, new or refurbished.</p>

      {/* Use case */}
      <h2 className="text-xs uppercase font-bold text-[#A99FB4] mb-2">What will you use it for?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {USE_CASES.map((u) => (
          <button key={u.id} onClick={() => setUseCase(u.id)}
            className={`text-left rounded-2xl border p-3 transition ${useCase === u.id ? 'border-coral bg-[#EEF1FB]' : 'border-[#E3E6F4] bg-white hover:border-coral'}`}>
            <div className="text-2xl">{u.icon}</div>
            <div className="font-bold text-sm mt-1">{u.label}</div>
            <div className="text-[11px] text-mut">{u.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xs uppercase font-bold text-[#A99FB4] mb-2">Max budget</h2>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button key={b} onClick={() => setBudget(b)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${budget === b ? 'border-coral bg-coral text-white' : 'border-[#D5DAF0] hover:border-coral'}`}>
                ≤ {fmtKES(b)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xs uppercase font-bold text-[#A99FB4] mb-2">Condition</h2>
          <div className="flex gap-2">
            {(['any', 'New', 'Refurbished'] as Condition[]).map((c) => (
              <button key={c} onClick={() => setCondition(c)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${condition === c ? 'border-coral bg-coral text-white' : 'border-[#D5DAF0] hover:border-coral'}`}>
                {c === 'any' ? 'Any' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 className="font-display text-xl font-bold mb-3">{loading ? 'Loading…' : `${picks.length} recommendation${picks.length === 1 ? '' : 's'}`}</h2>
      {!loading && picks.length === 0 && (
        <p className="text-mut text-sm">No match for that combination. Try raising the budget or switching condition to “Any”.</p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {picks.map((p, i) => (
          <Link key={p.slug} href={`/p/${p.slug}`}
            className="block rounded-2xl border border-[#E3E6F4] bg-white p-4 shadow-sm hover:-translate-y-1 hover:border-coral transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#A99FB4] font-bold">
                  {i === 0 ? 'Top pick' : `Option ${i + 1}`}
                  {(p.specs as { condition?: string })?.condition === 'Refurbished' && <span className="ml-2 text-[#9a6a12]">· Refurbished</span>}
                </div>
                <div className="font-bold text-sm mt-1">{p.name}</div>
                <div className="text-[11px] text-mut mt-0.5">{p.specSummary}</div>
              </div>
              <div className="text-coral font-bold whitespace-nowrap">{fmtKES(p.minPrice)}</div>
            </div>
            <div className="text-[11px] text-mut mt-2 pt-2 border-t border-[#E3E6F4]">✓ {reason(p)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
