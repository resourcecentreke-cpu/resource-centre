import type { PriceHistoryPoint } from '@rc/types';

export default function PriceHistoryChart({ history }: { history: PriceHistoryPoint[] }) {
  if (history.length < 2) return <p className="text-mut text-sm">Not enough history yet.</p>;
  const prices = history.map((h) => h.price);
  const w = 620, h = 160, pad = 8;
  const min = Math.min(...prices) * 0.98, max = Math.max(...prices) * 1.02;
  const sx = (i: number) => pad + (i * (w - 2 * pad)) / (history.length - 1);
  const sy = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
  const pts = history.map((p, i) => `${sx(i)},${sy(p.price)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 180 }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#3D52D5" strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={sx(history.length - 1)} cy={sy(prices[prices.length - 1])} r={4} fill="#3D52D5" />
    </svg>
  );
}
