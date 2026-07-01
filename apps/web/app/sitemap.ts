import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '../lib/api';
import { abs } from '../lib/seo';
import { allSegmentSlugs } from '../lib/phoneTiers';
import { guideSlugs } from '../lib/guides';

// Regenerate the sitemap at most hourly so new products get indexed quickly
// without hammering the API on every crawl.
export const revalidate = 3600;

/**
 * Dynamic sitemap — one URL per product and per category, plus the key static
 * routes. This is the backbone of programmatic SEO: it tells Google about every
 * "X price in Kenya" page so they can all be indexed and rank.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: abs('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: abs('/deals'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: abs('/explore'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: abs('/releases'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: abs('/phones'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: abs('/accessories'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: abs('/guides'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: abs('/laptops/chooser'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    ...guideSlugs().map((slug) => ({
      url: abs(`/guides/${slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    { url: abs('/tip'), lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: abs('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: abs('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: abs('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: abs('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: abs('/search'), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: abs('/compare'), lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    // Phone tier + price-band landing pages.
    ...allSegmentSlugs().map((seg) => ({
      url: abs(`/phones/${seg}`),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const categories = await getCategories();
    categoryRoutes = categories
      .filter((c) => c.productCount > 0)
      .map((c) => ({
        url: abs(`/c/${c.slug}`),
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
  } catch {
    /* API unavailable at build/crawl time — ship static + product routes we have. */
  }

  try {
    // Page through all products so every product page is listed.
    const pageSize = 120;
    let page = 1;
    let totalPages = 1;
    do {
      const res = await getProducts(`?pageSize=${pageSize}&page=${page}`);
      productRoutes.push(
        ...res.items.map((p) => ({
          url: abs(`/p/${p.slug}`),
          lastModified: now,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        })),
      );
      totalPages = res.totalPages || 1;
      page += 1;
    } while (page <= totalPages && page <= 50); // hard cap: 10k URLs
  } catch {
    /* ignore — partial sitemap is still valid */
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
