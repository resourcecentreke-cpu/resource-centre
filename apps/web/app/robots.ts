import type { MetadataRoute } from 'next';
import { abs } from '../lib/seo';

// Allow crawling of public pages, keep account/admin areas out of the index,
// and point crawlers at the dynamic sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/alerts', '/api/'],
    },
    sitemap: abs('/sitemap.xml'),
    host: abs('/'),
  };
}
