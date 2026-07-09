import type { Metadata } from 'next';
import Link from 'next/link';
import { abs, SITE_NAME } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'Advertise with us — reach Kenyan electronics shoppers',
  description:
    'Put your store or products in front of shoppers actively comparing electronics prices in Kenya. Sponsored placements and seller subscription plans, paid via M-Pesa.',
  alternates: { canonical: abs('/advertise') },
};

const CONTACT = 'mailto:akmutai07@gmail.com?subject=Advertising%20on%20Resource%20Centre';

/** Keep in sync with the API's PLAN_PRICES (payments.service.ts). */
const PLANS = [
  {
    name: 'Basic',
    price: 'KES 1,000',
    period: '/month',
    perks: ['Verified seller badge', 'Store profile with trust score', 'Listed in price comparisons'],
  },
  {
    name: 'Premium',
    price: 'KES 5,000',
    period: '/month',
    highlight: true,
    perks: ['Everything in Basic', 'Priority in comparison tables', 'Monthly click & search analytics', '1 sponsored slot included'],
  },
  {
    name: 'Enterprise',
    price: 'KES 20,000',
    period: '/month',
    perks: ['Everything in Premium', 'Homepage sponsored placements', 'Direct product-feed ingestion', 'Dedicated support'],
  },
];

const PLACEMENTS = [
  { icon: '🏠', name: 'Homepage strip', desc: 'A labelled card on the homepage — the first thing every visitor sees.' },
  { icon: '📂', name: 'Category top', desc: 'Top of a category listing (e.g. Smartphones), seen by high-intent comparers.' },
  { icon: '🔗', name: 'Product related', desc: 'Alongside a specific product page — reach shoppers at the moment of decision.' },
];

export default function AdvertisePage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <span className="inline-flex items-center gap-2 rounded-full border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral shadow-sm">
        📣 For stores & brands
      </span>
      <h1 className="mt-4 font-display text-3xl md:text-4xl font-bold leading-tight">
        Reach shoppers who are{' '}
        <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">ready to buy</span>
      </h1>
      <p className="mt-3 text-mut max-w-2xl">
        Every visitor on {SITE_NAME} is actively comparing electronics prices in Kenya. Put your store in
        front of them with a subscription or a sponsored placement — all clearly labelled, all paid
        conveniently via M-Pesa.
      </p>

      <h2 className="mt-10 font-display text-xl font-bold">Seller plans</h2>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border bg-white p-5 flex flex-col ${p.highlight ? 'border-coral shadow-md' : 'border-[#E3E6F4]'}`}
          >
            {p.highlight && <span className="self-start rounded-full bg-coral/10 text-coral text-[10px] font-bold uppercase px-2 py-0.5 mb-2">Most popular</span>}
            <div className="font-bold">{p.name}</div>
            <div className="mt-1">
              <span className="font-display text-2xl font-bold">{p.price}</span>
              <span className="text-xs text-mut">{p.period}</span>
            </div>
            <ul className="mt-3 space-y-1.5 flex-1">
              {p.perks.map((perk) => (
                <li key={perk} className="text-sm text-ink/90 flex gap-2"><span className="text-[#1FAE78]">✓</span><span>{perk}</span></li>
              ))}
            </ul>
            <a
              href={`${CONTACT}%20—%20${p.name}%20plan`}
              className={`mt-4 rounded-full px-4 py-2 text-center text-sm font-bold ${p.highlight ? 'bg-coral text-white' : 'border-2 border-[#D5DAF0] hover:border-coral'}`}
            >
              Get {p.name}
            </a>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-display text-xl font-bold">Sponsored placements</h2>
      <p className="text-sm text-mut mt-1">Fixed-period campaigns for a single product or your whole store. Priced per slot and duration.</p>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {PLACEMENTS.map((pl) => (
          <div key={pl.name} className="rounded-2xl border border-amber/40 bg-[#FFFDF5] p-5">
            <div className="text-2xl">{pl.icon}</div>
            <div className="font-bold mt-2">{pl.name}</div>
            <p className="text-sm text-mut mt-1">{pl.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-mint bg-gradient-to-br from-mint/10 to-white p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-display text-lg font-bold">How it works</div>
          <p className="text-sm text-mut mt-1 max-w-xl">
            1. Tell us your store and what you want to promote. &nbsp;2. We verify your store and set up
            the placement. &nbsp;3. Pay via M-Pesa STK push — your campaign goes live the same day.
          </p>
        </div>
        <a href={CONTACT} className="px-5 py-2.5 rounded-full bg-coral text-white font-bold text-sm shrink-0">
          Start advertising →
        </a>
      </div>

      <p className="mt-6 text-xs text-[#A99FB4]">
        All sponsored content is clearly labelled. Placements never change organic price rankings — the
        cheapest price always wins the comparison. See our <Link href="/terms" className="text-coral">terms</Link>.
      </p>
    </div>
  );
}
