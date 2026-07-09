'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * Hero — cinematic dark billboard (WorldQuant-inspired): near-black canvas
 * with a faint dot-grid, huge rotating statements, a glowing product stage
 * and the search front-and-centre. Rotates through REAL catalogue phones;
 * the pill rail below switches manually.
 */

const BLOBS = [
  { from: '#4F46E5', to: '#7C3AED' },
  { from: '#0EA5E9', to: '#4F46E5' },
  { from: '#059669', to: '#0EA5E9' },
  { from: '#7C3AED', to: '#DB2777' },
  { from: '#D97706', to: '#DB2777' },
];

/** WorldQuant-style cycling beliefs — ours are about prices. */
const STATEMENTS = [
  ['Every price', 'is information.'],
  ['Never overpay', 'again.'],
  ['Watch prices.', 'Strike on the drop.'],
  ['Every store.', 'One search.'],
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
  const [s, setS] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  // Statements rotate on their own clock, WorldQuant style.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setS((v) => (v + 1) % STATEMENTS.length), 3600);
    return () => clearInterval(t);
  }, [paused]);

  if (items.length === 0) return null;
  const active = items[i] ?? items[0]!;
  const blob = BLOBS[i % BLOBS.length]!;
  const statement = STATEMENTS[s] ?? STATEMENTS[0]!;

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
          <h1 className="hs-title" key={s}>
            <span className="hs-line hs-line-1">{statement[0]}</span>
            <span className="hs-line hs-line-2">{statement[1]}</span>
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
            <span className="hs-tag-go">Compare prices →</span>
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
          position: relative;
          border-radius: 24px;
          background:
            radial-gradient(60% 80% at 78% 40%, rgba(79, 70, 229, 0.22), transparent 65%),
            radial-gradient(circle, rgba(255, 255, 255, 0.055) 1px, transparent 1px) 0 0 / 22px 22px,
            #0a0a0f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 14px 12px;
          overflow: hidden;
        }
        .hs-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; align-items: center;
          border-radius: 16px; padding: 38px 30px 30px; min-height: 380px; }
        @media (max-width: 880px) { .hs-grid { grid-template-columns: 1fr; padding: 22px 14px; text-align: center; } }

        .hs-eyebrow { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px;
          background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 6px 14px; font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.02em; }
        .hs-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.5); animation: hs-ping 2.2s ease-out infinite; }

        .hs-title { margin: 18px 0 0; color: #fff; font-weight: 800;
          font-size: clamp(34px, 5vw, 58px); line-height: 1.02; letter-spacing: -0.035em;
          min-height: 2.1em; }
        .hs-line { display: block; opacity: 0; animation: hs-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hs-line-2 { animation-delay: 0.12s;
          background: linear-gradient(90deg, #ff6b5c, #ffc247, #2fd3a5);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .hs-sub { margin: 14px 0 0; max-width: 28rem; font-size: 15px; line-height: 1.65;
          color: rgba(255, 255, 255, 0.55); }
        @media (max-width: 880px) { .hs-sub { margin-inline: auto; } }

        .hs-search { display: flex; align-items: center; gap: 6px; margin-top: 24px; max-width: 30rem;
          border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.25); background: #fff;
          padding: 4px 4px 4px 16px; box-shadow: 0 12px 40px -12px rgba(79, 70, 229, 0.45); }
        @media (max-width: 880px) { .hs-search { margin-inline: auto; } }
        .hs-search-ic { color: #6b6b76; font-size: 18px; }
        .hs-search input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
          color: #1a1a20; font-size: 14.5px; padding: 9px 4px; }
        .hs-search input::placeholder { color: #9c9ca6; }
        .hs-search button { border-radius: 999px; background: #111118; color: #fff;
          font-weight: 700; font-size: 13.5px; padding: 10px 22px;
          transition: transform 0.16s ease, opacity 0.16s ease; }
        .hs-search button:hover { opacity: 0.88; }
        .hs-search button:active { transform: scale(0.97); }

        .hs-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        @media (max-width: 880px) { .hs-chips { justify-content: center; } }
        .hs-chip { border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.8);
          padding: 7px 14px; font-size: 12.5px; font-weight: 600; transition: all 0.16s ease; }
        .hs-chip:hover { border-color: rgba(255, 255, 255, 0.6); color: #fff; transform: translateY(-1px); }

        /* ── product stage — cutout floating on a glowing orb ───────────── */
        .hs-stage { position: relative; height: 330px; display: flex; align-items: center; justify-content: center; }
        @media (max-width: 880px) { .hs-stage { height: 270px; } }
        .hs-blob { position: absolute; width: 280px; height: 280px; border-radius: 50%;
          opacity: 0.55; filter: blur(6px); transition: background 0.9s ease;
          animation: hs-breathe 6s ease-in-out infinite; }
        .hs-blob::after { content: ''; position: absolute; inset: -22px; border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.28); }
        .hs-slot { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          transition: opacity 0.55s ease, transform 0.55s ease; }
        .hs-in { opacity: 1; transform: translateY(0) scale(1); }
        .hs-out { opacity: 0; transform: translateY(14px) scale(0.94); pointer-events: none; }
        .hs-photo { max-width: 62%; max-height: 285px; object-fit: contain;
          filter: drop-shadow(0 26px 34px rgba(0, 0, 0, 0.55)); animation: hs-float 7s ease-in-out infinite; }
        .hs-fallback { position: relative; z-index: 1; color: #fff; font-weight: 800; font-size: 26px; }

        .hs-tag { position: absolute; right: 2%; bottom: 4px; display: flex; flex-direction: column; gap: 2px;
          background: rgba(21, 21, 26, 0.92); border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px; backdrop-filter: blur(8px);
          box-shadow: 0 14px 30px -12px rgba(0, 0, 0, 0.7); padding: 11px 14px; max-width: 230px;
          transition: transform 0.18s ease, border-color 0.18s ease; }
        .hs-tag:hover { transform: translateY(-2px); border-color: rgba(255, 255, 255, 0.35); }
        .hs-tag-name { font-weight: 800; font-size: 13px; color: #fff;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-tag-price { font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, 0.85); }
        .hs-tag-go { font-size: 12px; font-weight: 700; margin-top: 2px; color: #2fd3a5; }

        /* ── thumbnail rail ─────────────────────────────────────────────── */
        .hs-rail { display: flex; gap: 8px; overflow-x: auto; padding: 4px 6px 6px; scrollbar-width: none; }
        .hs-rail::-webkit-scrollbar { display: none; }
        @media (max-width: 880px) { .hs-rail { justify-content: flex-start; } }
        .hs-thumb { flex: 1 1 0; min-width: 108px; max-width: 170px; display: flex; flex-direction: column;
          align-items: flex-start; gap: 1px; border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04);
          padding: 9px 12px; text-align: left; cursor: pointer; transition: all 0.16s ease; }
        .hs-thumb:hover { border-color: rgba(255, 255, 255, 0.45); }
        .hs-thumb-on { border: 2px solid rgba(255, 255, 255, 0.85); padding: 8px 11px;
          background: rgba(255, 255, 255, 0.08); }
        .hs-thumb-name { width: 100%; font-size: 11.5px; font-weight: 700; color: rgba(255, 255, 255, 0.92);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-thumb-price { font-size: 11px; font-weight: 600; color: rgba(255, 255, 255, 0.5); }

        @keyframes hs-ping { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        @keyframes hs-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hs-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes hs-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @media (prefers-reduced-motion: reduce) {
          .hs-dot, .hs-blob, .hs-photo { animation: none; }
          .hs-line { animation-duration: 0.01s; }
          .hs-slot { transition: opacity 0.3s ease; }
        }
      `}</style>
    </section>
  );
}
