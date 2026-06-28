import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGuide, guideSlugs } from '../../../lib/guides';
import JsonLd from '../../../components/JsonLd';
import { abs, SITE_NAME } from '../../../lib/seo';

export const revalidate = 3600;

export function generateStaticParams() {
  return guideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return { title: 'Guide' };
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: abs(`/guides/${slug}`) },
    openGraph: { type: 'article', title: `${g.title} · ${SITE_NAME}`, description: g.description, url: abs(`/guides/${slug}`) },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    datePublished: g.date || undefined,
    dateModified: g.date || undefined,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: abs(`/guides/${slug}`),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: abs('/guides') },
      { '@type': 'ListItem', position: 3, name: g.title, item: abs(`/guides/${slug}`) },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <nav className="text-xs text-mut mb-3">
        <Link href="/" className="text-coral">Home</Link> / <Link href="/guides" className="text-coral">Guides</Link> / {g.category || 'Guide'}
      </nav>
      <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">{g.title}</h1>
      {g.date && <p className="text-xs text-[#A99FB4] font-bold mt-2">Updated {new Date(g.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}

      <article
        className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-1 [&_a]:text-coral [&_a]:font-semibold hover:[&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:text-mut [&_li]:text-mut [&_blockquote]:border-l-4 [&_blockquote]:border-coral/40 [&_blockquote]:bg-[#EEF1FB] [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:rounded-r-xl [&_blockquote]:text-ink/80 [&_hr]:my-6 [&_hr]:border-[#E3E6F4]"
        dangerouslySetInnerHTML={{ __html: g.html }}
      />

      <div className="mt-10 rounded-2xl border border-coral/25 bg-gradient-to-r from-[#EEF1FB] to-[#F4F6FD] p-5">
        <div className="font-bold text-sm">Ready to compare prices?</div>
        <p className="text-sm text-mut mt-1">See live prices across Kenya’s trusted stores and find the best deal.</p>
        <Link href="/" className="text-coral font-semibold text-sm mt-2 inline-block">Browse all products →</Link>
      </div>
    </div>
  );
}
