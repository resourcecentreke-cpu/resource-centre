import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import { CONTACT, POLICY_UPDATED, SITE_NAME, abs } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses and protects your data, including cookies and Google AdSense advertising.`,
  alternates: { canonical: abs('/privacy') },
};

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy Policy"
      updated={POLICY_UPDATED}
      intro={`${SITE_NAME} ("we", "us") operates resourcecentre.co.ke, a price-comparison service for electronics in Kenya. This policy explains what data we collect, why, and your choices. We aim to collect as little personal data as possible.`}
    >
      <h2>Who we are</h2>
      <p>
        {SITE_NAME} is a Kenya-based electronics price-comparison website. For any
        privacy question or request, contact us at{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or{' '}
        <a href={`tel:${CONTACT.phoneIntl}`}>{CONTACT.phoneLocal}</a>.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Price alerts &amp; accounts:</b> if you set a price alert, we store the email address (and optionally phone number) you provide so we can notify you. You can ask us to delete these at any time.</li>
        <li><b>Usage analytics:</b> we record anonymous events such as searches, product views and outbound clicks to improve the catalogue and rankings. These are not tied to your identity.</li>
        <li><b>Technical data:</b> like most websites, our servers and providers may log IP address, browser type and pages visited for security and performance.</li>
        <li><b>Cookies:</b> small files stored on your device — see the Cookies section below.</li>
      </ul>
      <p>We do <b>not</b> sell your personal data.</p>

      <h2>How we use your information</h2>
      <ul>
        <li>To send the price alerts you request, via email, SMS or WhatsApp as you choose.</li>
        <li>To operate, secure and improve the website and its price rankings.</li>
        <li>To show relevant advertising through Google AdSense (see below).</li>
        <li>To process voluntary M-Pesa tips, if you choose to send one.</li>
      </ul>

      <h2>Cookies and advertising (Google AdSense)</h2>
      <p>
        We use cookies to remember your preferences and to power advertising. We display ads through
        <b> Google AdSense</b>. Third-party vendors, including Google, use cookies to serve ads based on
        your prior visits to this and other websites.
      </p>
      <ul>
        <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads based on your visits to our site and/or other sites on the Internet.</li>
        <li>You can opt out of personalised advertising by visiting{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
        <li>You can also opt out of some third-party vendors&apos; use of cookies at{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info/choices</a>.</li>
        <li>For more on how Google uses data, see{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google&apos;s privacy &amp; terms</a>.</li>
      </ul>
      <p>You can disable cookies in your browser settings, though some features may not work as well.</p>

      <h2>Affiliate &amp; referral links</h2>
      <p>
        Some links to retailers are referral or affiliate links. If you click through and buy, we may
        earn a small commission at no extra cost to you. This never affects the prices we show or how
        products are ranked. See our <a href="/terms">Terms</a> for details.
      </p>

      <h2>Third parties we rely on</h2>
      <p>
        We share limited data only with providers that help us run the service — for example email/SMS
        delivery for alerts, Safaricom M-Pesa for tips, and Google for advertising and analytics. Each
        processes data under its own terms.
      </p>

      <h2>Data retention &amp; your rights</h2>
      <p>
        We keep personal data only as long as needed for the purpose it was collected. Under Kenya&apos;s
        Data Protection Act, 2019 you can request access to, correction of, or deletion of your personal
        data, and withdraw consent for alerts at any time. Email{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> and we will respond promptly.
      </p>

      <h2>Children</h2>
      <p>This site is not directed at children under 18, and we do not knowingly collect their data.</p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The &quot;last updated&quot; date above reflects the latest
        version. Continued use of the site means you accept the current policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>, call{' '}
        <a href={`tel:${CONTACT.phoneIntl}`}>{CONTACT.phoneLocal}</a>, or message us on{' '}
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
      </p>
    </PageShell>
  );
}
