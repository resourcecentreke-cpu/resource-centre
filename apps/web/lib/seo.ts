// Centralised SEO helpers shared across pages, sitemap, robots and JSON-LD.

/** Public origin of the storefront, e.g. https://resourcecentre.co.ke (no trailing slash). */
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Brand / organisation name used in titles and structured data. */
export const SITE_NAME = 'Resource Centre';

/** Google AdSense publisher id (e.g. ca-pub-XXXXXXXXXXXXXXXX). */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-7697180631053911';

/** Admitad ad-space ownership verification token (meta tag method). */
export const ADMITAD_VERIFY = process.env.NEXT_PUBLIC_ADMITAD_VERIFY || 'f46679aa9e';

/** Contact details shown on Contact / legal pages and structured data. */
export const CONTACT = {
  email: 'resourcecentrke@gmail.com',
  phoneLocal: '0792 798 236',
  phoneIntl: '+254792798236', // for tel: and WhatsApp links
  whatsapp: 'https://wa.me/254792798236',
};

/** Date the legal/policy pages were last reviewed. */
export const POLICY_UPDATED = '21 June 2026';

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
