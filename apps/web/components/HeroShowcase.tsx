'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * Hero — "the price command centre".
 * Data-driven: features REAL catalogue phones. The active phone sits on a
 * parallax stage with ghosted neighbours and a floating glass price card,
 * over a slow aurora backdrop. A thumbnail rail doubles as the carousel
 * control; quick-filter chips sit under the search bar.
 *
 * Image resolution per phone (same chain as <ProductImage/>):
 *   1. catalogue image (affiliate feed), if it loads
 *   2. locally uploaded photo at /products/<slug>.jpg
 *   3. a stylized CSS render — graceful fallback so it never looks broken
 */

const ACCENTS = [
  { accent: '#8b7cff', glow: 'rgba(139,124,255,.5)' },
  { accent: '#5b8def', glow: 'rgba(91,141,239,.5)' },
  { accent: '#3ec6e0', glow: 'rgba(62,198,224,.45)' },
  { accent: '#a78bfa', glow: 'rgba(167,139,250,.5)' },
  { accent: '#7d8bf5', glow: 'rgba(125,139,245,.5)' },
];

const QUICK_LINKS = [
  { label: 'Budget phones', href: '/phones' },
  { label: '🔥 Today’s deals', href: '/deals' },
  { label: 'Flagships', href: '/explore' },
  { label: 'Laptops', href: '/laptops/chooser' },
];

type Phase = 'feed' | 'local' | 'render';

function PhoneVisual({ p, accent, className }: { p: ProductSummaryDTO; accent: string; className?: string }) {
  const [phase, setPhase] = useState<Phase>(p.image ? 'feed' : 'local');
  const src = phase === 'feed' ? (p.image as string) : `/products/${p.slug}.jpg`;

  if (phase !== 'render') {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={p.name}
        className={className ?? 'hs-photo'}
        onError={() => setPhase(phase === 'feed' ? 'local' : 'render')}
      />
    );
  }
  return (
    <div className={`hs-phone ${className ?? ''}`} style={{ background: 'linear-gradient(160deg,#2a2336,#0e0b18)' }}>
      <div className="hs-screen" style={{ background: `linear-gradient(135deg,#fff 0%,${accent} 55%,#1b1340 100%)` }}>
        <span className="hs-punch" />
        <span className="hs-reflect" />
      </div>
    </div>
  );
}

export default function HeroShowcase({ phones }: { phones: ProductSummaryDTO[] }) {
  const items = (phones ?? []).slice(0, 5);
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [paused, items.length]);

  if (items.length === 0) return null;
  const n = items.length;
  const active = items[i] ?? items[0]!;
  const theme = ACCENTS[i % ACCENTS.length]!;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Tilt-on-mouse parallax (CSS vars; disabled by media query for reduced motion).
  const onMove = (e: React.MouseEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  const pos = (idx: number): 'on' | 'prev' | 'next' | 'off' => {
    if (idx === i) return 'on';
    if (idx === (i - 1 + n) % n) return 'prev';
    if (idx === (i + 1) % n) return 'next';
    return 'off';
  };

  return (
    <section
      className="hs-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Aurora + grid + grain backdrop */}
      <div className="hs-bg" aria-hidden>
        <span className="hs-aurora hs-a1" />
        <span className="hs-aurora hs-a2" style={{ background: `radial-gradient(closest-side, ${theme.glow}, transparent 70%)` }} />
        <span className="hs-grid" />
        <span className="hs-grain" />
      </div>

      <div className="hs-inner">
        <div className="hs-copy">
          <span className="hs-live"><span className="hs-live-dot" /> Live · tracking prices across Kenya’s stores</span>
          <h1 className="hs-title">
            Every price.
            <br />
            Every store. <span className="hs-grad">One page.</span>
          </h1>
          <p className="hs-sub">
            Compare the newest tech across Kenya’s trusted shops — with price history,
            seller trust scores, delivery comparison and drop alerts.
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

        <div className="hs-stagewrap">
          <div className="hs-stage" ref={stageRef} onMouseMove={onMove} onMouseLeave={onLeave}>
            <div className="hs-halo" style={{ background: `radial-gradient(closest-side, ${theme.glow}, transparent 72%)` }} />
            {items.map((p, idx) => {
              const t = ACCENTS[idx % ACCENTS.length]!;
              return (
                <div key={p.slug} className={`hs-slot hs-${pos(idx)}`} aria-hidden={idx !== i}>
                  <PhoneVisual p={p} accent={t.accent} />
                </div>
              );
            })}
            <Link href={`/p/${active.slug}`} className="hs-card">
              <span className="hs-card-name">{active.name}</span>
              <span className="hs-card-spec">{active.specSummary || active.brand}</span>
              <span className="hs-card-row">
                <span className="hs-card-price">from {fmtKES(active.minPrice)}</span>
                <span className="hs-card-go" style={{ background: theme.accent }}>Compare →</span>
              </span>
            </Link>
            <span className="hs-tag" style={{ borderColor: theme.accent }}>
              📉 price tracked daily
            </span>
          </div>

          <div className="hs-rail" role="tablist" aria-label="Featured phones">
            {items.map((p, idx) => (
              <button
                key={p.slug}
                role="tab"
                aria-selected={idx === i}
                onClick={() => setI(idx)}
                className={`hs-thumb ${idx === i ? 'hs-thumb-on' : ''}`}
                style={idx === i ? { borderColor: ACCENTS[idx % ACCENTS.length]!.accent } : undefined}
                title={p.name}
              >
                <span className="hs-thumb-name">{p.name}</span>
                <span className="hs-thumb-price">{fmtKES(p.minPrice)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hs-wrap {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          background: #0b0a12;
          box-shadow: 0 30px 80px -30px rgba(10, 8, 30, 0.8);
          isolation: isolate;
        }
        .hs-bg { position: absolute; inset: 0; z-index: 0; }
        .hs-aurora { position: absolute; border-radius: 50%; filter: blur(70px); mix-blend-mode: screen; will-change: transform; }
        .hs-a1 { width: 720px; height: 720px; top: -320px; left: -160px;
          background: conic-gradient(from 0deg, #4f46e5, #7c3aed, #0ea5e9, #4f46e5);
          opacity: 0.55; animation: hs-spin 26s linear infinite; }
        .hs-a2 { width: 560px; height: 560px; right: -160px; bottom: -220px; opacity: 0.65;
          transition: background 1.2s ease; animation: hs-drift 18s ease-in-out infinite; }
        .hs-grid { position: absolute; inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 78%);
        }
        .hs-grain { position: absolute; inset: 0; opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E"); }

        .hs-inner { position: relative; z-index: 1; display: grid; grid-template-columns: 1.05fr 0.95fr;
          gap: 28px; align-items: center; padding: 52px 46px 40px; min-height: 460px; }
        @media (max-width: 900px) { .hs-inner { grid-template-columns: 1fr; padding: 36px 24px 32px; text-align: center; } }

        .hs-copy { color: #fff; }
        .hs-live { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.06);
          backdrop-filter: blur(6px); padding: 6px 14px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .hs-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399;
          box-shadow: 0 0 0 0 rgba(52,211,153,0.6); animation: hs-ping 2.2s ease-out infinite; }

        .hs-title { margin: 18px 0 0; font-weight: 650; font-size: clamp(32px, 4.6vw, 54px);
          line-height: 1.03; letter-spacing: -0.035em; }
        .hs-grad { background: linear-gradient(90deg, #c7c4ff 0%, #8b7cff 35%, #3ec6e0 70%, #c7c4ff 100%);
          background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: hs-sheen 7s ease-in-out infinite; }
        .hs-sub { margin: 14px 0 0; max-width: 30rem; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.72); }
        @media (max-width: 900px) { .hs-sub { margin-inline: auto; } }

        .hs-search { display: flex; align-items: center; gap: 6px; margin-top: 24px; max-width: 32rem;
          border-radius: 16px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px); padding: 6px 6px 6px 14px;
          transition: border-color 0.2s ease, background 0.2s ease; }
        .hs-search:focus-within { border-color: rgba(139,124,255,0.7); background: rgba(255,255,255,0.11); }
        @media (max-width: 900px) { .hs-search { margin-inline: auto; } }
        .hs-search-ic { color: rgba(255,255,255,0.5); font-size: 18px; }
        .hs-search input { flex: 1; min-width: 0; background: transparent; border: 0; outline: none;
          color: #fff; font-size: 14.5px; padding: 8px 4px; }
        .hs-search input::placeholder { color: rgba(255,255,255,0.45); }
        .hs-search button { border-radius: 11px; background: linear-gradient(135deg, #6d5ef2, #4f46e5);
          color: #fff; font-weight: 600; font-size: 13.5px; padding: 10px 20px;
          box-shadow: 0 10px 24px -10px rgba(79,70,229,0.9);
          transition: transform 0.16s ease, opacity 0.16s ease; }
        .hs-search button:hover { opacity: 0.92; }
        .hs-search button:active { transform: scale(0.97); }

        .hs-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        @media (max-width: 900px) { .hs-chips { justify-content: center; } }
        .hs-chip { border-radius: 999px; border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.78);
          padding: 7px 14px; font-size: 12.5px; font-weight: 600;
          transition: all 0.18s ease; }
        .hs-chip:hover { color: #fff; border-color: rgba(255,255,255,0.4); transform: translateY(-1px); }

        /* ── Stage ───────────────────────────────────────────── */
        .hs-stagewrap { display: flex; flex-direction: column; gap: 14px; }
        .hs-stage { position: relative; height: 340px; perspective: 1000px;
          --rx: 0deg; --ry: 0deg; }
        @media (max-width: 900px) { .hs-stage { height: 300px; } }
        .hs-halo { position: absolute; left: 50%; top: 50%; width: 340px; height: 340px;
          transform: translate(-50%, -50%); border-radius: 50%; transition: background 1.2s ease;
          animation: hs-pulse 5s ease-in-out infinite; }

        .hs-slot { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          transition: opacity 0.7s ease, transform 0.7s ease, filter 0.7s ease; will-change: transform, opacity; }
        .hs-on { opacity: 1; z-index: 3;
          transform: rotateX(var(--rx)) rotateY(var(--ry)) translateX(0) scale(1); }
        .hs-prev, .hs-next { opacity: 0.28; z-index: 1; filter: blur(2px) saturate(0.7); }
        .hs-prev { transform: translateX(-34%) scale(0.56) rotateY(14deg); }
        .hs-next { transform: translateX(34%) scale(0.56) rotateY(-14deg); }
        .hs-off { opacity: 0; transform: scale(0.5); pointer-events: none; }

        .hs-slot :global(.hs-photo) { max-width: 66%; max-height: 290px; object-fit: contain;
          filter: drop-shadow(0 30px 44px rgba(0, 0, 0, 0.55)); animation: hs-bob 6s ease-in-out infinite; }
        .hs-slot :global(.hs-phone) { position: relative; width: 152px; height: 300px; border-radius: 32px; padding: 7px;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.18);
          animation: hs-bob 6s ease-in-out infinite; }
        .hs-slot :global(.hs-screen) { position: relative; width: 100%; height: 100%; border-radius: 25px; overflow: hidden; }
        .hs-slot :global(.hs-punch) { position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
          width: 9px; height: 9px; border-radius: 50%; background: rgba(0,0,0,0.55); }
        .hs-slot :global(.hs-reflect) { position: absolute; inset: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 38%); mix-blend-mode: screen; }

        .hs-card { position: absolute; z-index: 4; left: 0; bottom: 6px; width: min(250px, 78%);
          display: flex; flex-direction: column; gap: 3px; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.16); background: rgba(20,17,34,0.55);
          backdrop-filter: blur(14px); padding: 13px 15px;
          transition: transform 0.2s ease, border-color 0.2s ease; }
        .hs-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.35); }
        @media (max-width: 900px) { .hs-card { left: 50%; transform: translateX(-50%); }
          .hs-card:hover { transform: translateX(-50%) translateY(-2px); } }
        .hs-card-name { font-weight: 700; font-size: 14px; color: #fff;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-card-spec { font-size: 11px; color: rgba(255,255,255,0.6);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-card-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 7px; }
        .hs-card-price { font-size: 13.5px; font-weight: 800; color: #fff; }
        .hs-card-go { border-radius: 999px; color: #fff; font-size: 11.5px; font-weight: 700;
          padding: 5px 12px; white-space: nowrap; transition: opacity 0.16s ease; }
        .hs-card:hover .hs-card-go { opacity: 0.9; }

        .hs-tag { position: absolute; z-index: 4; right: 2px; top: 14px;
          border-radius: 999px; border: 1px solid; background: rgba(20,17,34,0.6);
          backdrop-filter: blur(10px); color: #fff; font-size: 11px; font-weight: 700;
          padding: 6px 12px; animation: hs-bob 7s ease-in-out infinite; transition: border-color 1.2s ease; }
        @media (max-width: 900px) { .hs-tag { right: 8%; } }

        /* ── Thumbnail rail ──────────────────────────────────── */
        .hs-rail { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .hs-rail::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) { .hs-rail { justify-content: center; flex-wrap: wrap; overflow: visible; } }
        .hs-thumb { flex: 1 1 0; min-width: 96px; max-width: 150px; display: flex; flex-direction: column;
          align-items: flex-start; gap: 2px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04);
          padding: 9px 11px; text-align: left; cursor: pointer; transition: all 0.2s ease; }
        .hs-thumb:hover { background: rgba(255,255,255,0.09); }
        .hs-thumb-on { background: rgba(255,255,255,0.1); }
        .hs-thumb-name { width: 100%; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-thumb-price { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.55); }
        .hs-thumb-on .hs-thumb-price { color: #fff; }

        @keyframes hs-spin { to { transform: rotate(360deg); } }
        @keyframes hs-drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-46px, -30px); } }
        @keyframes hs-sheen { 0%, 100% { background-position: 0% 0; } 50% { background-position: 100% 0; } }
        @keyframes hs-ping { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.55); } 70% { box-shadow: 0 0 0 9px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
        @keyframes hs-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes hs-pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; } 50% { transform: translate(-50%, -50%) scale(1.07); opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .hs-aurora, .hs-halo, .hs-tag, .hs-live-dot, .hs-grad,
          .hs-slot :global(.hs-photo), .hs-slot :global(.hs-phone) { animation: none !important; }
          .hs-slot { transition: opacity 0.4s ease; }
          .hs-on { transform: none; }
        }
      `}</style>
    </section>
  );
}
