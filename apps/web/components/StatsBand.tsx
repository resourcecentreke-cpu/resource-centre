'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * WorldQuant-style stat counters ("1,100+ employees · 28 global offices"),
 * but ours are live catalogue numbers. Counts up when scrolled into view.
 */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span ref={ref} className="tnum">
      {v.toLocaleString('en-KE')}
      {suffix}
    </span>
  );
}

export default function StatsBand({
  stats,
}: {
  stats: { value: number; suffix?: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface px-6 py-7 text-center">
          <div className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            <Counter to={s.value} suffix={s.suffix ?? ''} />
          </div>
          <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-faint">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
