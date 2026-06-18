'use client';
import { useEffect, useState } from 'react';
import { toggleCompare, inCompare } from '../lib/compare';

export default function ProductActions({ slug, productId, suggestedTarget }: { slug: string; productId: string; suggestedTarget: number }) {
  const [cmp, setCmp] = useState(false);
  const [target, setTarget] = useState(suggestedTarget);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => setCmp(inCompare(slug)), [slug]);

  const watch = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rc_token') : null;
    if (!token) { setMsg('Sign in to save alerts on your account. Saved locally for now.'); saveLocal(); return; }
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, targetPrice: Number(target), channels: email ? ['email'] : ['email'] }),
      });
      if (!res.ok) throw new Error();
      setMsg('✅ Alert saved. We’ll notify you when the price drops.');
    } catch { setMsg('Saved locally (could not reach your account).'); saveLocal(); }
  };
  const saveLocal = () => {
    const w = JSON.parse(localStorage.getItem('rc_alerts') || '[]');
    w.push({ slug, target: Number(target), email });
    localStorage.setItem('rc_alerts', JSON.stringify(w));
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCmp(toggleCompare(slug).includes(slug))}
          className={`px-4 py-2 rounded-full text-sm font-bold border ${cmp ? 'bg-mint text-[#06382a] border-mint' : 'bg-white border-[#E7DACd]'}`}>
          {cmp ? '✓ In compare' : '+ Compare'}
        </button>
      </div>
      <div className="mt-4 bg-white border border-[#F1E7DC] rounded-2xl p-4">
        <div className="text-sm font-bold mb-2">🔔 Notify me when the price drops below</div>
        <div className="flex gap-2 flex-wrap items-end">
          <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="border border-[#E7DACd] rounded-lg p-2 text-sm w-36" />
          <input type="email" placeholder="email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-[#E7DACd] rounded-lg p-2 text-sm flex-1 min-w-[160px]" />
          <button onClick={watch} className="px-4 py-2 rounded-full text-sm font-bold bg-coral text-white">Notify me</button>
        </div>
        {msg && <p className="text-xs text-mut mt-2">{msg}</p>}
      </div>
    </div>
  );
}
