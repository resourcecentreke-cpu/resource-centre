import type { Metadata } from 'next';
import Link from 'next/link';
import { TIP, tipConfigured } from '../../lib/tip';
import { fmtKES } from '../../lib/format';
import { abs, SITE_NAME } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'Tip us — support Resource Centre',
  description:
    'Resource Centre is free to use. If it helped you find a better price, you can send us a small tip via M-Pesa to keep the price tracker running.',
  alternates: { canonical: abs('/tip') },
};

export default function TipPage() {
  const configured = tipConfigured();

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <span className="inline-flex items-center gap-2 rounded-full border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral shadow-sm">
        💛 Support the project
      </span>
      <h1 className="mt-4 font-display text-3xl md:text-4xl font-bold leading-tight">
        Tip us a little{' '}
        <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">token</span>
      </h1>
      <p className="mt-3 text-mut">
        {SITE_NAME} is free, ad-light and independent. We compare prices across Kenya’s trusted stores
        so you don’t overpay. If we saved you money, a small M-Pesa tip helps cover servers and keeps
        prices updated. Totally optional — never required.
      </p>

      {/* Suggested amounts (display only — they help the sender decide) */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TIP.suggested.map((a) => (
          <span
            key={a}
            className="rounded-full border-2 border-[#E7DACd] bg-white px-4 py-1.5 text-sm font-bold text-ink"
          >
            {fmtKES(a)}
          </span>
        ))}
        <span className="rounded-full border-2 border-dashed border-coral/40 bg-white px-4 py-1.5 text-sm font-bold text-coral">
          Any amount 🙂
        </span>
      </div>

      {configured ? (
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {TIP.till && (
            <div className="rounded-2xl border border-[#F1E7DC] bg-white p-5 shadow-sm">
              <div className="text-[11px] uppercase tracking-wide text-[#A99FB4] font-bold">
                M-Pesa · Buy Goods (Till)
              </div>
              <div className="mt-1 font-display text-3xl font-bold tracking-wider">{TIP.till}</div>
              <ol className="mt-4 space-y-1.5 text-sm text-mut list-decimal list-inside">
                <li>Go to <b className="text-ink">M-PESA → Lipa na M-PESA → Buy Goods and Services</b></li>
                <li>Enter Till Number <b className="text-ink">{TIP.till}</b></li>
                <li>Enter the amount and your PIN, then confirm</li>
              </ol>
            </div>
          )}
          {TIP.paybill && (
            <div className="rounded-2xl border border-[#F1E7DC] bg-white p-5 shadow-sm">
              <div className="text-[11px] uppercase tracking-wide text-[#A99FB4] font-bold">
                M-Pesa · Paybill
              </div>
              <div className="mt-1 font-display text-3xl font-bold tracking-wider">{TIP.paybill}</div>
              <ol className="mt-4 space-y-1.5 text-sm text-mut list-decimal list-inside">
                <li>Go to <b className="text-ink">M-PESA → Lipa na M-PESA → Pay Bill</b></li>
                <li>Business no. <b className="text-ink">{TIP.paybill}</b></li>
                <li>Account: <b className="text-ink">{TIP.paybillAccount}</b></li>
                <li>Enter the amount and your PIN, then confirm</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-amber/40 bg-[#FFF7E8] p-5 text-sm text-mut">
          <b className="text-ink">Tipping isn’t configured yet.</b> Add your M-Pesa Till or Paybill in{' '}
          <code className="px-1 py-0.5 rounded bg-white border border-[#F1E7DC]">apps/web/.env</code> using{' '}
          <code className="px-1 py-0.5 rounded bg-white border border-[#F1E7DC]">NEXT_PUBLIC_TIP_TILL</code> or{' '}
          <code className="px-1 py-0.5 rounded bg-white border border-[#F1E7DC]">NEXT_PUBLIC_TIP_PAYBILL</code>,
          then redeploy. This card will then show your real details.
        </div>
      )}

      <p className="mt-8 text-sm text-mut">
        Thank you for keeping {SITE_NAME} independent. 🙏{' '}
        <Link href="/" className="text-coral font-semibold hover:underline">Back to comparing prices →</Link>
      </p>
    </div>
  );
}
