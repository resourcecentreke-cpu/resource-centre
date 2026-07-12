'use client';
import { useEffect, useRef } from 'react';

/**
 * Adsterra banner unit — pays per impression/click and performs well on
 * Kenyan traffic. Renders NOTHING until both env vars are set, so it's safe
 * to ship before the account is approved:
 *
 *   NEXT_PUBLIC_ADSTERRA_KEY   the ad-unit key from the Adsterra dashboard
 *   NEXT_PUBLIC_ADSTERRA_SRC   the invoke.js URL Adsterra gives you
 *                              (e.g. //www.highperformanceformat.com/<key>/invoke.js)
 *
 * Default size 320x50 (mobile leaderboard) — override via props to match the
 * unit you created in the dashboard.
 */
export default function AdsterraBanner({
  width = 320,
  height = 50,
  className = '',
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const key = process.env.NEXT_PUBLIC_ADSTERRA_KEY;
  const src = process.env.NEXT_PUBLIC_ADSTERRA_SRC;

  useEffect(() => {
    const el = ref.current;
    if (!el || !key || !src || el.childElementCount > 0) return;
    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.text = `atOptions = { key: '${key}', format: 'iframe', height: ${height}, width: ${width}, params: {} };`;
    const invoke = document.createElement('script');
    invoke.type = 'text/javascript';
    invoke.src = src;
    invoke.async = true;
    el.appendChild(conf);
    el.appendChild(invoke);
  }, [key, src, width, height]);

  if (!key || !src) return null;
  return (
    <div className={`flex justify-center ${className}`}>
      <div ref={ref} style={{ width, height }} />
    </div>
  );
}
