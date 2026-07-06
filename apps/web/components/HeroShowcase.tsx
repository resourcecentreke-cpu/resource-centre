'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * Hero — eBay-style cover banner. A big, light, rounded promo card: bold ink
 * typography and a prominent search on the left, the featured phone as a
 * cutout on a colour blob on the right with a floating price tag. Rotates
 * through REAL catalogue phones; the pill rail below switches manually.
 */

const BLOBS = [
  { from: '#4F46E5', to: '#7C3AED' },
  { from: '#0EA5E9', to: '#4F46E5' },
  { from: '#059669', to: '#0EA5E9' },
  { from: '#7C3AED', to: '#DB2777' },
  { from: '#D97706', to: '#DB2777' },
];

const QUICK_LINKS = [
  { label: 'Budget phones', href: '/phones' },
  { label: '🔥 Today’s deals', href: '/deals' },
  { label: 'Flagships', href: '/explore' },
  { label: 'Laptops', href: '/laptops/chooser' },
];

type Phase = 'feed' | 'local' | 'render';

function PhoneVisual({ p }: { p: ProductSummaryDTO }) {
  const [phase, setPhase] = useState<Phase>(p.image ? 'feed' : 'local');
  useEffect(() => setPhase(p.image ? 'feed' : 'local'), [p.slug, p.image]);
  if (phase === 'render') {
    return <span className="hs-fallback">{p.brand}</span>;
  }
  const src = phase === 'feed' ? (p.image as string) : `/products/${p.slug}.jpg`;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={p.name}
      className="hs-photo"
      onError={() => setPhase(phase === 'feed' ? 'local' : 'render')}
    />
  );
}

export default function HeroShowcase({ phones }: { phones: ProductSummaryDTO[] }) {
  const items = (phones ?? []).slice(0, 5);
  const router = useRouter();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  if (items.length === 0) return null;
  const active = items[i] ?? items[0]!;
  const blob = BLOBS[i % BLOBS.length]!;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <section
      className="hs-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hs-grid">
        <div className="hs-copy">
          <span className="hs-eyebrow">
            <span className="hs-dot" /> Live price tracking · Kenya
          </span>
          <h1 className="hs-title">
            Every price. Every store.
            <br />
            One page.
          </h1>
          <p className="hs-sub">
            Compare the newest tech across Kenya’s trusted shops — price history,
            seller trust scores and drop alerts included.
          </p>

          <form className="hs-search" onSubmit={submit}>
            <span className="hs-search-ic" aria-hidden>⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a phone, laptop or brand…"
              aria-label="Search products"
            />
            <button type="submit">Search</button>
          </form>

          <div className="hs-chips">
            {QUICK_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hs-chip">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="hs-stage">
          <span
            className="hs-blob"
            style={{ background: `linear-gradient(135deg, ${blob.from}, ${blob.to})` }}
          />
          {items.map((p, idx) => (
            <div key={p.slug} className={`hs-slot ${idx === i ? 'hs-in' : 'hs-out'}`} aria-hidden={idx !== i}>
              <PhoneVisual p={p} />
            </div>
          ))}
          <Link href={`/p/${active.slug}`} className="hs-tag">
            <span className="hs-tag-name">{active.name}</span>
            <span className="hs-tag-price">from {fmtKES(active.minPrice)}</span>
            <span className="hs-tag-go" style={{ color: blob.from }}>Compare prices →</span>
          </Link>
        </div>
      </div>

      <div className="hs-rail" role="tablist" aria-label="Featured phones">
        {items.map((p, idx) => (
          <button
            key={p.slug}
            role="tab"
            aria-selected={idx === i}
            onClick={() => setI(idx)}
            className={`hs-thumb ${idx === i ? 'hs-thumb-on' : ''}`}
            title={p.name}
          >
            <span className="hs-thumb-name">{p.name}</span>
            <span className="hs-thumb-price">{fmtKES(p.minPrice)}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .hs-wrap {
          border-radius: 24px;
          background: linear-gradient(180deg, #f6f5f2 0%, #efedf8 100%);
          border: 1px solid rgb(var(--line));
          padding: 14px 14px 12px;
        }
        .hs-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; align-items: center;
          border-radius: 16px; padding: 34px 30px 30px; min-height: 360px; }
        @media (max-width: 880px) { .hs-grid { grid-template-columns: 1fr; padding: 22px 14px; text-align: center; } }

        .hs-eyebrow { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px;
          background: #fff; border: 1px solid rgb(var(--line)); padding: 6px 14px;
          font-size: 12px; font-weight: 700; color: rgb(var(--muted)); }
        .hs-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.5); animation: hs-ping 2.2s ease-out infinite; }

        .hs-title { margin: 16px 0 0; color: rgb(var(--text)); font-weight: 800;
          font-size: clamp(30px, 4.4vw, 48px); line-height: 1.05; letter-spacing: -0.03em; }
        .hs-sub { margin: 12px 0 0; max-width: 28rem; font-size: 15px; line-height: 1.6; color: rgb(var(--muted)); }
        @media (max-width: 880px) { .hs-sub { margin-inline: auto; } }

        .hs-search { display: flex; align-items: center; gap: 6px; margin-top: 22px; max-width: 30rem;
          border-radius: 999px; border: 2px solid rgb(var(--text)); background: #fff;
          padding: 4px 4px 4px 16px; }
        @media (max-width: 880px) { .hs-search { margin-inline: auto; } }
        .hs-search-ic { color: rgb(var(--muted)); font-size: 18px; }
        .hs-search input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
          color: rgb(var(--text)); font-size: 14.5px; padding: 9px 4px; }
        .hs-search input::placeholder { color: rgb(var(--faint)); }
        .hs-search button { border-radius: 999px; background: rgb(var(--accent)); color: #fff;
          font-weight: 700; font-size: 13.5px; padding: 10px 22px;
          transition: transform 0.16s ease, opacity 0.16s ease; }
        .hs-search button:hover { opacity: 0.92; }
        .hs-search button:active { transform: scale(0.97); }

        .hs-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        @media (max-width: 880px) { .hs-chips { justify-content: center; } }
        .hs-chip { border-radius: 999px; border: 1px solid rgb(var(--line)); background: #fff;
          color: rgb(var(--text)); padding: 7px 14px; font-size: 12.5px; font-weight: 600;
          transition: all 0.16s ease; }
        .hs-chip:hover { border-color: rgb(var(--text)); transform: translateY(-1px); }

        /* ── product stage (eBay-style cutout on a colour blob) ─────────── */
        .hs-stage { position: relative; height: 320px; display: flex; align-items: center; justify-content: center; }
        @media (max-width: 880px) { .hs-stage { height: 270px; } }
        .hs-blob { position: absolute; width: 290px; height: 290px; border-radius: 50%;
          opacity: 0.92; transition: background 0.9s ease; }
        .hs-blob::after { content: ''; position: absolute; inset: -18px; border-radius: 50%;
          border: 2px dashed rgba(255,255,255,0.55); }
        .hs-slot { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          transition: opacity 0.55s ease, transform 0.55s ease; }
        .hs-in { opacity: 1; transform: translateY(0) scale(1); }
        .hs-out { opacity: 0; transform: translateY(14px) scale(0.94); pointer-events: none; }
        .hs-photo { max-width: 62%; max-height: 280px; object-fit: contain;
          filter: drop-shadow(0 22px 26px rgba(20, 16, 60, 0.28)); }
        .hs-fallback { position: relative; z-index: 1; color: #fff; font-weight: 800; font-size: 26px; }

        .hs-tag { position: absolute; right: 2%; bottom: 4px; display: flex; flex-direction: column; gap: 2px;
          background: #fff; border: 1px solid rgb(var(--line)); border-radius: 14px;
          box-shadow: 0 14px 30px -14px rgba(20,16,60,0.25); padding: 11px 14px; max-width: 230px;
          transition: transform 0.18s ease; }
        .hs-tag:hover { transform: translateY(-2px); }
        .hs-tag-name { font-weight: 800; font-size: 13px; color: rgb(var(--text));
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-tag-price { font-size: 13px; font-weight: 700; color: rgb(var(--text)); }
        .hs-tag-go { font-size: 12px; font-weight: 700; margin-top: 2px; }

        /* ── thumbnail rail ─────────────────────────────────────────────── */
        .hs-rail { display: flex; gap: 8px; overflow-x: auto; padding: 4px 6px 6px; scrollbar-width: none; }
        .hs-rail::-webkit-scrollbar { display: none; }
        @media (max-width: 880px) { .hs-rail { justify-content: flex-start; } }
        .hs-thumb { flex: 1 1 0; min-width: 108px; max-width: 170px; display: flex; flex-direction: column;
          align-items: flex-start; gap: 1px; border-radius: 12px; border: 1px solid rgb(var(--line));
          background: #fff; padding: 9px 12px; text-align: left; cursor: pointer; transition: all 0.16s ease; }
        .hs-thumb:hover { border-color: rgb(var(--text)); }
        .hs-thumb-on { border: 2px solid rgb(var(--text)); padding: 8px 11px; }
        .hs-thumb-name { width: 100%; font-size: 11.5px; font-weight: 700; color: rgb(var(--text));
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-thumb-price { font-size: 11px; font-weight: 600; color: rgb(var(--muted)); }

        @keyframes hs-ping { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        @media (prefers-reduced-motion: reduce) {
          .hs-dot { animation: none; }
          .hs-slot { transition: opacity 0.3s ease; }
        }
      `}</style>
    </section>
  );
}
