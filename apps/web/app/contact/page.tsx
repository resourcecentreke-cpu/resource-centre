import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import { CONTACT, SITE_NAME, abs } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with ${SITE_NAME} — email, phone or WhatsApp.`,
  alternates: { canonical: abs('/contact') },
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact us"
      intro="Questions, feedback, a store or device to add, or a price that looks off? We'd love to hear from you."
    >
      <div className="grid sm:grid-cols-3 gap-4 not-prose">
        <a href={`mailto:${CONTACT.email}`} className="block rounded-2xl border border-[#E3E6F4] bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-coral transition">
          <div className="text-2xl">✉️</div>
          <div className="font-bold text-sm mt-2">Email</div>
          <div className="text-xs text-mut mt-0.5 break-all">{CONTACT.email}</div>
        </a>
        <a href={`tel:${CONTACT.phoneIntl}`} className="block rounded-2xl border border-[#E3E6F4] bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-coral transition">
          <div className="text-2xl">📞</div>
          <div className="font-bold text-sm mt-2">Phone</div>
          <div className="text-xs text-mut mt-0.5">{CONTACT.phoneLocal}</div>
        </a>
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-[#E3E6F4] bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-coral transition">
          <div className="text-2xl">💬</div>
          <div className="font-bold text-sm mt-2">WhatsApp</div>
          <div className="text-xs text-mut mt-0.5">{CONTACT.phoneLocal}</div>
        </a>
      </div>

      <h2>Business hours</h2>
      <p>We typically reply within one business day, Monday to Saturday.</p>

      <h2>For retailers</h2>
      <p>
        Want your store listed, or to correct your prices and stock? Email{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> with your store name and website and we&apos;ll
        get back to you.
      </p>

      <p className="text-xs text-[#A99FB4] mt-6">
        See also our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a>.
      </p>
    </PageShell>
  );
}
