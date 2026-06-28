'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ProductSummaryDTO } from '@rc/types';
import { fmtKES } from '../lib/format';

/**
 * Flagship "fluid ad" hero. Data-driven: it features REAL phones from the
 * catalogue and shows their real product photos over an animated liquid-gradient
 * backdrop (the OnePlus / Pixel launch-page aesthetic).
 *
 * Image resolution per phone (same chain as <ProductImage/>):
 *   1. catalogue image (affiliate feed / GSM Arena), if it loads
 *   2. locally uploaded photo at /products/<slug>.jpg  (drop one via the admin)
 *   3. a stylized CSS render — graceful fallback so it never looks broken
 *
 * So the moment real photos land (affiliate feed or the no-code uploader),
 * the hero shows real phones automatically — no code change.
 */

const ACCENTS = [
  { accent: '#6f7cf0', glow: 'rgba(111,124,240,.5)' },
  { accent: '#2FD3A5', glow: 'rgba(47,211,165,.5)' },
  { accent: '#FF5DA2', glow: 'rgba(255,93,162,.5)' },
  { accent: '#5B8DEF', glow: 'rgba(91,141,239,.5)' },
  { accent: '#E6B422', glow: 'rgba(230,180,34,.5)' },
];

type Phase = 'feed' | 'local' | 'render';

function PhoneVisual({ p, accent }: { p: ProductSummaryDTO; accent: string }) {
  // Start at the catalogue image if present, else jump straight to the local photo.
  const [phase, setPhase] = useState<Phase>(p.image ? 'feed' : 'local');
  const src = phase === 'feed' ? (p.image as string) : `/products/${p.slug}.jpg`;

  if (phase !== 'render') {
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
  // Stylized fallback — generic flagship render tinted to the accent.
  return (
    <div className="hs-phone" style={{ background: 'linear-gradient(160deg,#2a2336,#0e0b18)' }}>
      <div
        className="hs-screen"
        style={{ background: `linear-gradient(135deg,#fff 0%,${accent} 55%,#1b1340 100%)` }}
      >
        <span className="hs-punch" />
        <span className="hs-reflect" />
      </div>
      <div className="hs-cam-mod" style={{ background: 'linear-gradient(160deg,#2a2336,#0e0b18)' }}>
        <span className="hs-lens" />
        <span className="hs-lens" />
      </div>
    </div>
  );
}

export default function HeroShowcase({ phones }: { phones: ProductSummaryDTO[] }) {
  const items = (phones ?? []).slice(0, 5);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  if (items.length === 0) return null;
  const active = items[i] ?? items[0]!;
  const activeTheme = ACCENTS[i % ACCENTS.length]!;

  return (
    <section
      className="hs-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hs-bg">
        <span className="hs-blob hs-b1" />
        <span className="hs-blob hs-b2" />
        <span className="hs-blob hs-b3" />
        <span className="hs-blob hs-b4" style={{ background: activeTheme.accent }} />
      </div>

      <div className="hs-grid">
        <div className="hs-copy">
          <span className="hs-badge">✨ Kenya · live price tracker</span>
          <h1 className="hs-title">
            The newest tech,
            <br />
            <span className="hs-grad">at the best price.</span>
          </h1>
          <p className="hs-sub">
            The latest flagships and every device after — compare prices across Kenya’s trusted
            stores, with price history, seller trust scores and delivery comparison.
          </p>
          <div className="hs-cta">
            <Link href="/phones" className="hs-btn hs-btn-p">Browse phones</Link>
            <Link href="/deals" className="hs-btn hs-btn-s">🔥 Today’s deals</Link>
          </div>
          <div className="hs-pills">
            {items.map((p, idx) => (
              <button
                key={p.slug}
                onClick={() => setI(idx)}
                className={`hs-pill ${idx === i ? 'hs-pill-on' : ''}`}
                style={idx === i ? { borderColor: ACCENTS[idx % ACCENTS.length]!.accent, color: '#fff' } : undefined}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="hs-show">
          {items.map((p, idx) => {
            const theme = ACCENTS[idx % ACCENTS.length]!;
            return (
              <div key={p.slug} className={`hs-stage ${idx === i ? 'hs-in' : 'hs-out'}`} aria-hidden={idx !== i}>
                <div
                  className="hs-halo"
                  style={{ background: `radial-gradient(closest-side, ${theme.glow}, transparent 70%)` }}
                />
                <PhoneVisual p={p} accent={theme.accent} />
              </div>
            );
          })}
          <Link href={`/p/${active.slug}`} className="hs-now">
            <span className="hs-now-dot" style={{ background: activeTheme.accent }} />
            <span className="hs-now-name">{active.name}</span>
            <span className="hs-now-tag">{active.specSummary || active.brand}</span>
            <span className="hs-now-price">from {fmtKES(active.minPrice)}</span>
            <span className="hs-now-go">Compare prices →</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .hs-wrap {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          background: radial-gradient(120% 120% at 80% 0%, #241a44 0%, #160f2e 55%, #0d0920 100%);
          box-shadow: 0 30px 80px -30px rgba(20, 12, 48, 0.7);
          isolation: isolate;
        }
        .hs-bg { position: absolute; inset: 0; z-index: 0; }
        .hs-blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.7; mix-blend-mode: screen; will-change: transform; }
        .hs-b1 { width: 420px; height: 420px; background: #3d52d5; top: -120px; left: -80px; animation: hs-float1 14s ease-in-out infinite; }
        .hs-b2 { width: 360px; height: 360px; background: #ff5da2; bottom: -140px; left: 30%; animation: hs-float2 18s ease-in-out infinite; }
        .hs-b3 { width: 300px; height: 300px; background: #e6b422; top: -60px; right: 18%; animation: hs-float3 16s ease-in-out infinite; }
        .hs-b4 { width: 460px; height: 460px; right: -120px; bottom: -120px; opacity: 0.5; transition: background 1.2s ease; animation: hs-float1 20s ease-in-out infinite reverse; }

        .hs-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px; align-items: center; padding: 48px 44px; min-height: 440px; }
        @media (max-width: 860px) { .hs-grid { grid-template-columns: 1fr; padding: 34px 26px 40px; text-align: center; } }

        .hs-copy { color: #fff; }
        .hs-badge { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.25); background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(6px); padding: 6px 14px; font-size: 12px; font-weight: 700; color: #fff; }
        .hs-title { margin: 16px 0 0; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: clamp(30px, 4.4vw, 50px); line-height: 1.05; letter-spacing: -0.01em; }
        .hs-grad { background: linear-gradient(90deg, #ffd36e, #ff5da2 55%, #8aa0ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hs-sub { margin: 14px 0 0; max-width: 30rem; font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.78); }
        @media (max-width: 860px) { .hs-sub { margin-inline: auto; } }
        .hs-cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
        @media (max-width: 860px) { .hs-cta { justify-content: center; } }
        .hs-btn { border-radius: 999px; padding: 11px 22px; font-weight: 700; font-size: 14px; transition: transform 0.15s ease; }
        .hs-btn:hover { transform: translateY(-2px); }
        .hs-btn-p { background: linear-gradient(90deg, #3d52d5, #6f7cf0); color: #fff; box-shadow: 0 12px 30px -10px rgba(61, 82, 213, 0.9); }
        .hs-btn-s { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; }
        .hs-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 26px; }
        @media (max-width: 860px) { .hs-pills { justify-content: center; } }
        .hs-pill { border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.7); padding: 6px 13px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-pill:hover { color: #fff; }
        .hs-pill-on { background: rgba(255, 255, 255, 0.14); }

        .hs-show { position: relative; height: 360px; display: flex; align-items: center; justify-content: center; }
        .hs-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transition: opacity 0.7s ease, transform 0.7s ease; }
        .hs-in { opacity: 1; transform: translateY(0) scale(1); }
        .hs-out { opacity: 0; transform: translateY(18px) scale(0.94); pointer-events: none; }
        .hs-halo { position: absolute; width: 340px; height: 340px; border-radius: 50%; z-index: -1; animation: hs-pulse 5s ease-in-out infinite; }

        .hs-photo { max-width: 78%; max-height: 300px; object-fit: contain; filter: drop-shadow(0 26px 40px rgba(0, 0, 0, 0.5)); animation: hs-bob 6s ease-in-out infinite; }

        .hs-phone { position: relative; width: 168px; height: 320px; border-radius: 34px; padding: 7px; box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.18); animation: hs-bob 6s ease-in-out infinite; }
        .hs-screen { position: relative; width: 100%; height: 100%; border-radius: 27px; overflow: hidden; }
        .hs-punch { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 9px; height: 9px; border-radius: 50%; background: rgba(0, 0, 0, 0.55); }
        .hs-reflect { position: absolute; inset: 0; background: linear-gradient(120deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 38%); mix-blend-mode: screen; }
        .hs-cam-mod { position: absolute; top: 16px; left: 16px; border-radius: 16px; padding: 8px; display: flex; gap: 5px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12); }
        .hs-lens { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #6b7280, #111317 70%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25); }

        .hs-now { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 264px; display: grid; grid-template-columns: auto 1fr; grid-template-areas: 'dot name' 'tag tag' 'price price' 'go go'; gap: 2px 8px; align-items: center; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); padding: 12px 14px; }
        .hs-now-dot { grid-area: dot; width: 9px; height: 9px; border-radius: 50%; }
        .hs-now-name { grid-area: name; font-weight: 800; font-size: 14px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-now-tag { grid-area: tag; font-size: 11px; line-height: 1.4; color: rgba(255, 255, 255, 0.66); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hs-now-price { grid-area: price; font-size: 13px; font-weight: 800; color: #fff; margin-top: 4px; }
        .hs-now-go { grid-area: go; margin-top: 6px; font-size: 12px; font-weight: 700; color: #ffd36e; }

        @keyframes hs-bob { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-12px) rotate(1deg); } }
        @keyframes hs-pulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes hs-float1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(40px, 30px); } }
        @keyframes hs-float2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-50px, -20px); } }
        @keyframes hs-float3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, 40px); } }
        @media (prefers-reduced-motion: reduce) {
          .hs-blob, .hs-photo, .hs-phone, .hs-halo { animation: none !important; }
          .hs-stage { transition: opacity 0.4s ease; }
        }
      `}</style>
    </section>
  );
}
