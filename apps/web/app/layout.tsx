import type { Metadata } from 'next';
import './globals.css';
import Header from '../components/Header';
import PwaRegister from '../components/PwaRegister';
import JsonLd from '../components/JsonLd';
import Link from 'next/link';
import { SITE_URL, SITE_NAME, abs } from '../lib/seo';

const DESCRIPTION =
  'Compare phones, laptops, TVs, gaming, cameras and more across Kenya’s trusted online stores — price history, seller trust scores, delivery comparison and price alerts.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Resource Centre · Compare Kenya Electronics Prices',
    template: '%s · Resource Centre',
  },
  description: DESCRIPTION,
  manifest: '/manifest.webmanifest',
  applicationName: SITE_NAME,
  keywords: ['price comparison Kenya', 'phone prices Kenya', 'laptop prices Kenya', 'electronics Kenya', 'best price Kenya'],
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

export const viewport = { themeColor: '#FF6B5C' };

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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <JsonLd data={siteJsonLd} />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#F1E7DC] bg-[#FFF4EC] mt-10">
          <div className="max-w-6xl mx-auto px-5 py-8 text-sm text-mut flex flex-wrap gap-6 justify-between">
            <p className="max-w-sm">Compare the lowest listed price across Kenya’s trusted online electronics stores. Prices indicative — confirm on the retailer’s page before buying.</p>
            <div className="flex gap-6">
              <Link href="/deals">Deals</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/alerts">Alerts</Link>
              <Link href="/tip">💛 Tip us</Link>
            </div>
          </div>
        </footer>
        <PwaRegister />
      </body>
    </html>
  );
}
