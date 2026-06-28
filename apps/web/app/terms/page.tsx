import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import { CONTACT, POLICY_UPDATED, SITE_NAME, abs } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms governing your use of ${SITE_NAME}, including pricing accuracy, affiliate links and limitation of liability.`,
  alternates: { canonical: abs('/terms') },
};

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      updated={POLICY_UPDATED}
      intro={`By using ${SITE_NAME} (resourcecentre.co.ke) you agree to these terms. Please read them carefully.`}
    >
      <h2>What we provide</h2>
      <p>
        {SITE_NAME} aggregates and compares prices for electronics sold by third-party retailers in
        Kenya. We are an information service — we do not sell products ourselves, hold stock, or process
        purchases. All transactions happen on the retailer&apos;s own website, under their terms.
      </p>

      <h2>Pricing &amp; availability are indicative</h2>
      <ul>
        <li>Prices, stock status and specifications are gathered from various sources and may be modelled, delayed or out of date.</li>
        <li>Always confirm the final price, availability and warranty on the retailer&apos;s page before buying.</li>
        <li>We are not responsible for differences between a price shown here and the price at checkout on a retailer&apos;s site.</li>
      </ul>

      <h2>Affiliate &amp; referral links</h2>
      <p>
        Some outbound links are affiliate or referral links, meaning we may earn a commission if you
        buy after clicking. This comes at no extra cost to you and does not influence our prices,
        rankings or editorial choices.
      </p>

      <h2>Advertising</h2>
      <p>
        We display third-party ads (including Google AdSense). We are not responsible for the content
        of ads or the products and services they promote. See our <a href="/privacy">Privacy Policy</a>{' '}
        for how advertising cookies work and how to opt out.
      </p>

      <h2>Tips</h2>
      <p>
        The &quot;Tip us&quot; feature lets you voluntarily send a small amount via M-Pesa to support the
        service. Tips are optional, non-refundable, and do not entitle you to any product, service or
        preferential treatment.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t use the site unlawfully, scrape it at scale, or attempt to disrupt it.</li>
        <li>Reviews and submitted content must be honest and lawful; we may moderate or remove content.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The site is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that
        information is accurate, complete or current, or that the site will be uninterrupted or error-free.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {SITE_NAME} is not liable for any loss or damage arising
        from your use of the site or reliance on its information, including purchasing decisions made
        using prices shown here.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Kenya, and disputes are subject to the Kenyan courts.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or call{' '}
        <a href={`tel:${CONTACT.phoneIntl}`}>{CONTACT.phoneLocal}</a>.
      </p>
    </PageShell>
  );
}
