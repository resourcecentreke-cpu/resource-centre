'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fmtKES } from '../../lib/format';

interface LocalAlert { slug: string; target: number; email?: string }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);
  useEffect(() => {
    try { setAlerts(JSON.parse(localStorage.getItem('rc_alerts') || '[]')); } catch { /* */ }
  }, []);
  const remove = (i: number) => {
    const next = alerts.filter((_, j) => j !== i);
    setAlerts(next);
    localStorage.setItem('rc_alerts', JSON.stringify(next));
  };
  return (
    <div className="max-w-3xl mx-auto px-5 py-6">
      <h1 className="font-display text-2xl font-bold mb-1">My price alerts</h1>
      <p className="text-mut text-sm mb-4">Saved on this device. Sign in to sync alerts to your account and get email/SMS/WhatsApp notifications.</p>
      {!alerts.length ? <p className="text-mut">No alerts yet. Open a product and tap “Notify me”.</p> : (
        <div className="rounded-2xl border border-[#E3E6F4] bg-white overflow-hidden">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b border-[#E3E6F4] last:border-0">
              <Link href={`/p/${a.slug}`} className="font-semibold text-coral">{a.slug}</Link>
              <span className="text-sm">≤ {fmtKES(a.target)}</span>
              <button onClick={() => remove(i)} className="text-[#E25555] text-sm">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
