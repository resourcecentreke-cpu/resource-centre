// Centralised SEO helpers shared across pages, sitemap, robots and JSON-LD.

/** Public origin of the storefront, e.g. https://resourcecentre.co.ke (no trailing slash). */
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Brand / organisation name used in titles and structured data. */
export const SITE_NAME = 'Resource Centre';

/** Build an absolute URL from a site-relative path. */
export const abs = (path = '/'): string => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/**
 * Prices in the API/display layer are whole Kenyan shillings (see fmtKES), so
 * structured-data prices use the same integer. Schema.org wants a plain string.
 */
export const priceString = (n: number): string => String(Math.round(n));

/** ISO date helper that tolerates already-ISO strings or Date objects. */
export const isoDate = (d: string | Date): string =>
  (d instanceof Date ? d : new Date(d)).toISOString();
