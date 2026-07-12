'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { OrderQuoteDTO } from '@rc/types';
import { createOrder, getOrder } from '../lib/api';
import { fmtKES } from '../lib/format';

type Step = 'form' | 'paying' | 'paid' | 'timeout';

/**
 * Concierge checkout: customer fills delivery details, gets an M-Pesa STK
 * push for item + service fee, and we purchase from the store on their
 * behalf. Polls the order until payment confirms.
 */
export default function CheckoutForm({ quote }: { quote: OrderQuoteDTO }) {
  const [step, setStep] = useState<Step>('form');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ customerName: '', phone: '', email: '', city: '', address: '', notes: '' });
  const polls = useRef(0);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await createOrder({ offerId: quote.offerId, ...f });
      setOrderId(res.orderId);
      setStep('paying');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  };

  // Poll order status while waiting for the M-Pesa PIN confirmation.
  useEffect(() => {
    if (step !== 'paying' || !orderId) return;
    polls.current = 0;
    const t = setInterval(async () => {
      polls.current += 1;
      if (polls.current > 40) { setStep('timeout'); clearInterval(t); return; } // ~2 min
      try {
        const o = await getOrder(orderId);
        if (o.status !== 'pending_payment') { setStep('paid'); clearInterval(t); }
      } catch { /* transient — keep polling */ }
    }, 3000);
    return () => clearInterval(t);
  }, [step, orderId]);

  if (step === 'paid') {
    return (
      <div className="rounded-2xl border border-mint bg-gradient-to-br from-mint/10 to-white p-8 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="font-display text-2xl font-bold mt-3">Payment received!</h2>
        <p className="text-mut text-sm mt-2 max-w-md mx-auto">
          We’re now placing your order for <b className="text-ink">{quote.productName}</b> with{' '}
          <b className="text-ink">{quote.sellerName}</b>. We’ll reach you on your phone
          {f.email ? ' and email' : ''} with delivery updates.
        </p>
        <p className="text-xs text-[#A99FB4] mt-3">Order ref: <span className="font-mono">{orderId}</span> — save this.</p>
        <Link href="/" className="inline-block mt-5 px-5 py-2.5 rounded-full bg-coral text-white font-bold text-sm">Back to browsing →</Link>
      </div>
    );
  }

  if (step === 'paying' || step === 'timeout') {
    return (
      <div className="rounded-2xl border border-[#E3E6F4] bg-white p-8 text-center">
        <div className="text-4xl">{step === 'paying' ? '📲' : '⏱️'}</div>
        <h2 className="font-display text-2xl font-bold mt-3">
          {step === 'paying' ? 'Check your phone' : 'Still waiting for payment'}
        </h2>
        <p className="text-mut text-sm mt-2 max-w-md mx-auto">
          {step === 'paying'
            ? <>Enter your M-Pesa PIN to pay <b className="text-ink">{fmtKES(quote.total)}</b>. This page updates automatically once the payment lands.</>
            : <>We haven’t seen the payment yet. If you cancelled or the prompt expired, you can retry — your order ref is <span className="font-mono">{orderId}</span>.</>}
        </p>
        {step === 'paying' && (
          <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
            {[0, 1, 2].map((d) => (
              <span key={d} className="h-2 w-2 rounded-full bg-coral animate-bounce" style={{ animationDelay: `${d * 0.16}s` }} />
            ))}
          </div>
        )}
        {step === 'timeout' && (
          <button onClick={() => setStep('form')} className="mt-5 px-5 py-2.5 rounded-full bg-coral text-white font-bold text-sm">
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <>
    <div className="mb-5 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
      <div className="rounded-xl border border-[#E3E6F4] bg-white px-2 py-2.5">📲 Pay with M-Pesa</div>
      <div className="rounded-xl border border-[#E3E6F4] bg-white px-2 py-2.5">🛡️ Refund if unfulfilled</div>
      <div className="rounded-xl border border-[#E3E6F4] bg-white px-2 py-2.5">🚚 Delivery coordinated</div>
    </div>
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="rounded-2xl border border-[#E3E6F4] bg-white p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Delivery details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-bold text-mut">Full name *</span>
            <input required minLength={2} value={f.customerName} onChange={set('customerName')} className="input mt-1" placeholder="Jane Wanjiku" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-mut">M-Pesa phone *</span>
            <input required value={f.phone} onChange={set('phone')} className="input mt-1" placeholder="07XX XXX XXX" inputMode="tel" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-mut">Email (optional)</span>
            <input type="email" value={f.email} onChange={set('email')} className="input mt-1" placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-mut">City / town *</span>
            <input required minLength={2} value={f.city} onChange={set('city')} className="input mt-1" placeholder="Nairobi" />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-bold text-mut">Delivery address *</span>
          <input required minLength={4} value={f.address} onChange={set('address')} className="input mt-1" placeholder="Estate, street, building, house/apt" />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-mut">Notes (optional)</span>
          <textarea value={f.notes} onChange={set('notes')} className="input mt-1 min-h-[70px]" placeholder="Colour preference, alternative number…" />
        </label>
        {error && <p className="text-sm font-semibold text-coral">{error}</p>}
      </div>

      <div className="rounded-2xl border border-[#E3E6F4] bg-white p-6 lg:sticky lg:top-20">
        <h2 className="font-display text-lg font-bold">Order summary</h2>
        <div className="mt-3 text-sm space-y-2">
          <div className="flex justify-between gap-3"><span className="text-mut">{quote.productName}</span><b className="tnum whitespace-nowrap">{fmtKES(quote.unitPrice)}</b></div>
          <div className="flex justify-between gap-3"><span className="text-mut">Service fee ({Math.max(1, Math.round((quote.serviceFee / quote.unitPrice) * 100))}% — we buy &amp; deliver it for you)</span><b className="tnum whitespace-nowrap">{fmtKES(quote.serviceFee)}</b></div>
          <div className="border-t border-[#E3E6F4] pt-2 flex justify-between gap-3 text-base"><span className="font-bold">Total</span><b className="tnum text-coral">{fmtKES(quote.total)}</b></div>
        </div>
        <p className="text-[11px] text-[#A99FB4] mt-3 leading-relaxed">
          Sold by <b>{quote.sellerName}</b>. You pay us via M-Pesa; we purchase from the store on
          your behalf and coordinate delivery. Full refund if the store can’t fulfil.
        </p>
        <button
          type="submit"
          disabled={busy || !quote.inStock}
          className="mt-4 w-full rounded-full bg-coral px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Sending M-Pesa prompt…' : `Pay ${fmtKES(quote.total)} with M-Pesa`}
        </button>
        {!quote.inStock && <p className="text-xs font-bold text-coral mt-2 text-center">This offer is currently out of stock.</p>}
        <p className="mt-3 text-center text-[11px] text-[#A99FB4]">
          🔒 Paid via M-Pesa (IntaSend). Nothing is charged until you enter your PIN on your phone.
        </p>
      </div>
    </form>
    </>
  );
}
