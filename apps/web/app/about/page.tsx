import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import { CONTACT, SITE_NAME, abs } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'About',
  description: `${SITE_NAME} helps Kenyans compare electronics prices across trusted online stores — phones, laptops, TVs, appliances and accessories.`,
  alternates: { canonical: abs('/about') },
};

export default function AboutPage() {
  return (
    <PageShell
      title={`About ${SITE_NAME}`}
      intro="We help people in Kenya buy electronics at the best price — without visiting a dozen shops or browser tabs."
    >
      <h2>What we do</h2>
      <p>
        {SITE_NAME} compares prices for phones, laptops, TVs, home appliances and accessories across
        Kenya&apos;s trusted online retailers. For each device we show the lowest listed price, a side-by-side
        store comparison, price history so you can spot a genuine deal, seller trust scores, and delivery
        options — all in one place.
      </p>

      <h2>Why we built it</h2>
      <p>
        Electronics prices in Kenya vary a lot between stores, and they change often. We built {SITE_NAME}{' '}
        so shoppers can quickly see who has the best price right now, track when prices drop, and buy with
        more confidence. Our catalogue spans flagship phones to budget devices, refurbished laptops, and
        large appliances like fridges, washing machines and dishwashers.
      </p>

      <h2>How we make money</h2>
      <p>
        The site is free to use. We sustain it through advertising and, on some retailer links, referral
        commissions earned when you buy after clicking through — at no extra cost to you. This never
        affects the prices we display or how we rank products. You can also support us directly with a
        small <a href="/tip">M-Pesa tip</a>.
      </p>

      <h2>A note on accuracy</h2>
      <p>
        We work to keep information current, but prices, stock and specs can change quickly and may be
        modelled or delayed. Always confirm the final details on the retailer&apos;s page before buying. See
        our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a> for more.
      </p>

      <h2>Get in touch</h2>
      <p>
        We&apos;d love your feedback — found a price that&apos;s off, a store we should add, or a device we&apos;re
        missing? Reach us via the <a href="/contact">Contact page</a>, email{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>, or WhatsApp{' '}
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">{CONTACT.phoneLocal}</a>.
      </p>
    </PageShell>
  );
}
