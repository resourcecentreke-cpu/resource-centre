import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderQuote } from '../../../lib/api';
import CheckoutForm from '../../../components/CheckoutForm';

export const metadata: Metadata = {
  title: 'Checkout — we buy it for you',
  robots: { index: false }, // transactional page, keep out of search
};

export default async function CheckoutPage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  let quote;
  try {
    quote = await getOrderQuote(offerId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <nav className="text-xs text-mut mb-3">
        <Link href="/" className="text-coral">Home</Link> /{' '}
        <Link href={`/p/${quote.productSlug}`} className="text-coral">{quote.productName}</Link> / Checkout
      </nav>
      <h1 className="font-display text-2xl md:text-3xl font-bold">
        Order <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">{quote.productName}</span>
      </h1>
      <p className="text-mut text-sm mt-2 max-w-2xl">
        Pay securely via M-Pesa and we’ll purchase it from <b className="text-ink">{quote.sellerName}</b> on
        your behalf — no store account needed, delivery coordinated for you.
      </p>
      <div className="mt-6">
        <CheckoutForm quote={quote} />
      </div>
    </div>
  );
}
