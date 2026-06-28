'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * Five brand-accented flagship cards for the homepage. Data-driven: it shows
 * REAL catalogue phones (price, link, image) — the priciest in-stock device per
 * brand. Real photos resolve the same way as <ProductImage/>:
 *   catalogue/feed image → /products/<slug>.jpg → branded gradient fallback.
 */

const ACCENT: Record<string, string> = {
  Apple: '#0A84FF',
  Samsung: '#2E5BFF',
  Google: '#1A73E8',
  OnePlus: '#EB0028',
  Xiaomi: '#FF6900',
  Tecno: '#1E9E6A',
  Infinix: '#7A2BD6',
  Realme: '#FFC915',
  Oppo: '#19A463',
  Vivo: '#4F6CF7',
  Honor: '#00A1E0',
  Nothing: '#111111',
};
const accentFor = (brand: string) => ACCENT[brand] ?? '#3D52D5';

type Phase = 'feed' | 'local' | 'fail';

function CardImage({ p, accent }: { p: ProductSummaryDTO; accent: string }) {
  const [phase, setPhase] = useState<Phase>(p.image ? 'feed' : 'local');

  if (phase === 'fail') {
    return (
      <div
        className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-1.5 px-4 text-center text-white"
        style={{ background: `radial-gradient(120% 120% at 50% 0%, ${accent}, #14101f)` }}
      >
        <span className="font-display font-bold text-lg leading-tight">{p.name}</span>
        <span className="text-[11px] opacity-85">Add a product photo</span>
      </div>
    );
  }
  const src = phase === 'feed' ? (p.image as string) : `/products/${p.slug}.jpg`;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={p.name}
      className="relative z-[2] max-w-[74%] max-h-[230px] object-contain transition-transform duration-300 group-hover:scale-105"
      style={{ filter: 'drop-shadow(0 20px 24px rgba(0,0,0,.22))' }}
      onError={() => setPhase(phase === 'feed' ? 'local' : 'fail')}
    />
  );
}

export default function FlagshipCards({ phones }: { phones: ProductSummaryDTO[] }) {
  const items = (phones ?? []).slice(0, 5);
  if (items.length === 0) return null;

  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {items.map((p) => {
        const accent = accentFor(p.brand);
        const chips = (p.specSummary || '')
          .split(/[·,]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4);
        return (
          <article
            key={p.slug}
            className="group flex flex-col overflow-hidden rounded-3xl border border-[#E3E6F4] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} />
            <div
              className="relative flex h-64 items-center justify-center overflow-hidden"
              style={{ background: `radial-gradient(120% 120% at 50% 10%, ${accent}14, #ffffff 70%)` }}
            >
              <CardImage p={p} accent={accent} />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: accent }}>
                {p.brand}
              </span>
              <h3 className="mt-1 font-display text-xl font-bold leading-tight">{p.name}</h3>
              {chips.length > 0 && (
                <div className="mt-3 mb-4 flex flex-wrap gap-1.5">
                  {chips.map((c, idx) => (
                    <span key={idx} className="rounded-lg bg-bg2 px-2.5 py-1 text-[11.5px] font-semibold text-ink">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto">
                <span className="block text-[11px] font-semibold text-mut">from</span>
                <span className="font-display text-xl font-bold">{fmtKES(p.minPrice)}</span>
              </div>
              <Link
                href={`/p/${p.slug}`}
                className="mt-4 block rounded-xl py-2.5 text-center text-sm font-bold text-white transition hover:brightness-110"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }}
              >
                Compare prices →
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
