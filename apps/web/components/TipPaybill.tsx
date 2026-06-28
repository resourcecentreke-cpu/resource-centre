'use client';
import { useState } from 'react';
import { fmtKES } from '../lib/format';

/**
 * Interactive "Tip us" prompt. The supporter picks an amount and enters their
 * M-Pesa number; we trigger an STK push (Daraja) so they just confirm with their
 * PIN on their phone — no copying numbers. Funds settle to the configured
 * Paybill / bank account. A manual Paybill fallback shows if STK isn't available.
 */
export default function TipPaybill({
  paybill,
  account,
  bank,
  suggested,
}: {
  paybill: string;
  account: string;
  bank: string;
  suggested: number[];
}) {
  const [amount, setAmount] = useState<number | ''>(suggested[1] ?? 100);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showManual, setShowManual] = useState(false);

  const amt = typeof amount === 'number' && amount > 0 ? amount : null;
  const phoneOk = /^(?:\+?254|0)?7\d{8}$/.test(phone.replace(/\s/g, ''));

  const send = async () => {
    if (!amt || !phoneOk) return;
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\s/g, ''), amount: amt }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { customerMessage?: string };
      setStatus('sent');
      setMessage(data.customerMessage || 'Check your phone and enter your M-Pesa PIN to complete the tip.');
    } catch {
      setStatus('error');
      setShowManual(true);
      setMessage('Could not send the M-Pesa prompt right now. You can still tip manually below.');
    }
  };

  return (
    <div className="rounded-2xl border border-[#E3E6F4] bg-white p-5 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-[#A99FB4] font-bold">M-Pesa → {bank}</div>
      <h2 className="font-display text-lg font-bold mt-0.5">Send a tip</h2>

      {/* Amount */}
      <label className="block text-xs font-bold text-[#A99FB4] uppercase mt-4 mb-1.5">Amount</label>
      <div className="flex flex-wrap gap-2">
        {suggested.map((a) => (
          <button key={a} type="button" onClick={() => setAmount(a)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${amount === a ? 'border-coral bg-coral text-white' : 'border-[#D5DAF0] hover:border-coral'}`}>
            {fmtKES(a)}
          </button>
        ))}
        <label className="inline-flex items-center gap-2 rounded-full border-2 border-[#D5DAF0] px-3 py-1 text-sm">
          <span className="text-mut">KSh</span>
          <input type="number" min={10} inputMode="numeric" placeholder="other"
            value={typeof amount === 'number' && !suggested.includes(amount) ? amount : ''}
            onChange={(e) => setAmount(e.target.value ? Math.max(0, parseInt(e.target.value, 10)) : '')}
            className="w-20 outline-none bg-transparent" />
        </label>
      </div>

      {/* Phone */}
      <label className="block text-xs font-bold text-[#A99FB4] uppercase mt-4 mb-1.5">M-Pesa number</label>
      <input type="tel" inputMode="tel" placeholder="07XX XXX XXX" value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border-2 border-[#D5DAF0] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-coral" />

      <button type="button" onClick={send} disabled={!amt || !phoneOk || status === 'sending'}
        className="mt-4 w-full rounded-full bg-coral text-white font-bold text-sm py-3 disabled:opacity-50 transition hover:brightness-110">
        {status === 'sending' ? 'Sending prompt…' : amt ? `Send ${fmtKES(amt)} M-Pesa prompt` : 'Send M-Pesa prompt'}
      </button>

      {status === 'sent' && (
        <div className="mt-3 rounded-xl border border-mint/40 bg-[#F1FBF6] p-3 text-sm text-[#0e8f68]">
          📲 {message}
        </div>
      )}
      {status === 'error' && (
        <div className="mt-3 rounded-xl border border-amber/40 bg-[#FBF3DA] p-3 text-sm text-mut">{message}</div>
      )}

      <p className="mt-3 text-[11px] text-mut">
        We never see your M-Pesa PIN — you confirm the payment on your own phone. Tips are voluntary and
        go to our {bank} account.
      </p>

      {/* Manual fallback */}
      <button type="button" onClick={() => setShowManual((s) => !s)} className="mt-3 text-xs font-semibold text-coral hover:underline">
        {showManual ? 'Hide manual option' : 'Prefer to pay manually?'}
      </button>
      {showManual && (
        <ol className="mt-2 space-y-1 text-sm text-mut list-decimal list-inside rounded-xl bg-[#EEF1FB] p-3">
          <li>Open <b className="text-ink">M-PESA → Lipa na M-PESA → Pay Bill</b></li>
          <li>Business number: <b className="text-ink">{paybill}</b></li>
          <li>Account number: <b className="text-ink">{account}</b></li>
          <li>Enter the amount and your PIN, then confirm</li>
        </ol>
      )}
    </div>
  );
}
