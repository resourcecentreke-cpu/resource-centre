import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';
import Logo from '../components/Logo';
import PwaRegister from '../components/PwaRegister';
import JsonLd from '../components/JsonLd';
import Link from 'next/link';
import { SITE_URL, SITE_NAME, abs, ADSENSE_CLIENT, ADMITAD_VERIFY } from '../lib/seo';

const DESCRIPTION =
  'Compare phones, laptops, TVs, home appliances, power tools and more across Kenya’s trusted online stores — live prices, price history, seller trust scores, product age and price alerts, all at a glance.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Resource Centre · Compare Kenya Electronics Prices',
    template: '%s · Resource Centre',
  },
  description: DESCRIPTION,
  manifest: '/manifest.webmanifest',
  applicationName: SITE_NAME,
  keywords: [
    'price comparison Kenya', 'phone prices Kenya', 'laptop prices Kenya', 'electronics Kenya',
    'best price Kenya', 'home appliances Kenya', 'power tools prices Kenya', 'TV prices Kenya',
    'fridge prices Kenya', 'washing machine prices Kenya', 'generator prices Kenya', 'solar prices Kenya',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Resource Centre · Compare Kenya Electronics Prices',
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'en_KE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resource Centre · Compare Kenya Electronics Prices',
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: '#4F46E5' };

// Site-wide structured data: the brand + a sitelinks search box in Google.
const siteJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: abs('/search?q={search_term_string}') },
      'query-input': 'required name=search_term_string',
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Product photos frequently come from GSMArena's CDN — start the TLS handshake early. */}
        <link rel="preconnect" href="https://fdn2.gsmarena.com" />
        {/* Inter — one quiet, cohesive typeface across the whole site. */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&display=swap" rel="stylesheet" />
        {/* Admitad ad-space ownership verification */}
        <meta name="verify-admitad" content={ADMITAD_VERIFY} />
        {/* Google AdSense — site verification + auto ads loader.
            Rendered as a literal <script> (not next/script) so the AdSense
            crawler finds it in the raw server HTML during site verification. */}
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
        {/* Monetag — second CPC/CPM network (good non-Tier-1 rates, $5 min payout).
            Loads only when both env vars are set; paste values from the Monetag
            dashboard's tag snippet: src → NEXT_PUBLIC_MONETAG_SRC, data-zone →
            NEXT_PUBLIC_MONETAG_ZONE. */}
        {process.env.NEXT_PUBLIC_MONETAG_SRC && process.env.NEXT_PUBLIC_MONETAG_ZONE && (
          <script
            async
            src={process.env.NEXT_PUBLIC_MONETAG_SRC}
            data-zone={process.env.NEXT_PUBLIC_MONETAG_ZONE}
            data-cfasync="false"
          />
        )}
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <JsonLd data={siteJsonLd} />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-white/10 bg-[#0A0A0F] text-white/60">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-10 px-5 py-12 text-sm">
            <div className="max-w-sm">
              <Logo dark size={34} />
              <p className="mt-4 leading-relaxed">
                Compare the lowest listed price across Kenya’s trusted online
                electronics stores. Prices indicative — confirm on the retailer’s
                page before buying.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-7 gap-y-2.5">
              {[
                ['/deals', 'Deals'],
                ['/releases', 'New & Upcoming'],
                ['/phones', 'Phones'],
                ['/accessories', 'Accessories'],
                ['/stores', 'Stores'],
                ['/guides', 'Guides'],
                ['/compare', 'Compare'],
                ['/alerts', 'Alerts'],
                ['/tip', 'Tip us'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-colors duration-fast ease-out hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-wrap gap-x-7 gap-y-2.5">
              {[
                ['/about', 'About'],
                ['/advertise', 'Advertise'],
                ['/contact', 'Contact'],
                ['/privacy', 'Privacy'],
                ['/terms', 'Terms'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-colors duration-fast ease-out hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mx-auto max-w-6xl px-5 pb-8 text-xs text-white/30">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </div>
        </footer>
        <PwaRegister />
      </body>
    </html>
  );
}
