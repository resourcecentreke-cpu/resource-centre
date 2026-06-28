import type { Metadata } from 'next';
import Link from 'next/link';
import { TIP, tipConfigured } from '../../lib/tip';
import TipPaybill from '../../components/TipPaybill';
import { abs, SITE_NAME } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'Tip us — support Resource Centre',
  description:
    'Resource Centre is free to use. If it helped you find a better price, you can send a small M-Pesa tip to our DTB account to keep the price tracker running.',
  alternates: { canonical: abs('/tip') },
};

export default function TipPage() {
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

      {tipConfigured() ? (
        <div className="mt-8">
          <TipPaybill
            paybill={TIP.paybill}
            account={TIP.paybillAccount}
            bank={TIP.bank}
            suggested={TIP.suggested}
          />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-amber/40 bg-[#FBF3DA] p-5 text-sm text-mut">
          <b className="text-ink">Tipping isn’t configured yet.</b> Set{' '}
          <code className="px-1 py-0.5 rounded bg-white border border-[#E3E6F4]">NEXT_PUBLIC_TIP_PAYBILL</code> and{' '}
          <code className="px-1 py-0.5 rounded bg-white border border-[#E3E6F4]">NEXT_PUBLIC_TIP_PAYBILL_ACCOUNT</code>{' '}
          in <code className="px-1 py-0.5 rounded bg-white border border-[#E3E6F4]">apps/web/.env</code>, then redeploy.
        </div>
      )}

      <p className="mt-8 text-sm text-mut">
        Thank you for keeping {SITE_NAME} independent. 🙏{' '}
        <Link href="/" className="text-coral font-semibold hover:underline">Back to comparing prices →</Link>
      </p>
    </div>
  );
}
