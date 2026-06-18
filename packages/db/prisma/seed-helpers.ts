/* Shared seed helpers + reference data (Phase 1–2). */

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\+/g, ' plus ') // keep "S26+" distinct from "S26"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG seeded by a string — same input always yields same sequence. */
export function rng(seedStr: string): () => number {
  let s = hash(seedStr) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const BRANDS: Record<string, string> = {
  iPhone: 'Apple', iPad: 'Apple', MacBook: 'Apple', AirPods: 'Apple', Apple: 'Apple',
  Galaxy: 'Samsung', Samsung: 'Samsung', Pixel: 'Google', Google: 'Google',
  OnePlus: 'OnePlus', Oppo: 'Oppo', Honor: 'Honor', Xiaomi: 'Xiaomi', Sony: 'Sony',
  Bose: 'Bose', JBL: 'JBL', Nothing: 'Nothing', CMF: 'Nothing', Dell: 'Dell',
  ASUS: 'ASUS', Lenovo: 'Lenovo', Microsoft: 'Microsoft', LG: 'LG',
  PlayStation: 'Sony', Nintendo: 'Nintendo', Meta: 'Meta', DJI: 'DJI', GoPro: 'GoPro',
};
export function brandOf(name: string): string {
  const first = name.split(/\s+/)[0] ?? name;
  return BRANDS[first] ?? first;
}

/** Map the source category (+name for "Other") to a displayed category key. */
export function catKeyFor(cat: string, name: string): string {
  if (cat === 'Phones') return 'Smartphones';
  if (cat === 'Computers') return 'Laptops';
  if (cat === 'Premium TVs') return 'TVs';
  if (cat === 'Tablets') return 'Tablets';
  if (cat === 'Audio') return 'Audio';
  if (/PlayStation|Switch|Quest/.test(name)) return 'Gaming Consoles';
  if (/DJI|GoPro/.test(name)) return 'Cameras';
  if (/Watch/.test(name)) return 'Smart Watches';
  return 'Accessories';
}

export interface SeedSeller {
  name: string; years: number; rating: number; returns: number;
  warranty: string; ship: number; verified: boolean; website: string; search: string;
}

export function trustScore(s: SeedSeller): number {
  const yr = (Math.min(s.years, 12) / 12) * 22;
  const rt = (s.rating / 5) * 34;
  const sh = s.ship * 22;
  const rr = (Math.min(s.returns, 14) / 14) * 12;
  const wr = s.warranty.startsWith('12') ? 10 : 6;
  return Math.round(yr + rt + sh + rr + wr);
}

export const CATEGORIES = [
  'Smartphones', 'Laptops', 'TVs', 'Tablets', 'Audio', 'Gaming Consoles',
  'Cameras', 'Smart Watches', 'Accessories', 'Refrigerators', 'Home Appliances', 'Networking',
];

export const SELLERS: SeedSeller[] = [
  { name: 'Jumia KE', years: 12, rating: 4.5, returns: 7, warranty: '12-mo', ship: 0.86, verified: true, website: 'https://www.jumia.co.ke', search: 'https://www.jumia.co.ke/catalog/?q={q}' },
  { name: 'Phone Place Kenya', years: 9, rating: 4.6, returns: 7, warranty: '12-mo', ship: 0.9, verified: true, website: 'https://www.phoneplacekenya.com', search: 'https://www.phoneplacekenya.com/?s={q}' },
  { name: 'Avechi', years: 11, rating: 4.7, returns: 14, warranty: '12-mo', ship: 0.88, verified: true, website: 'https://avechi.co.ke', search: 'https://avechi.co.ke/?s={q}' },
  { name: 'Gadgets Leo', years: 6, rating: 4.4, returns: 7, warranty: '6-mo', ship: 0.82, verified: true, website: 'https://gadgetsleo.com', search: 'https://gadgetsleo.com/?s={q}' },
  { name: 'Price Point', years: 7, rating: 4.3, returns: 7, warranty: '6-mo', ship: 0.8, verified: false, website: 'https://pricepoint.co.ke', search: 'https://pricepoint.co.ke/?s={q}' },
  { name: 'iTey Store', years: 5, rating: 4.5, returns: 14, warranty: '12-mo', ship: 0.85, verified: true, website: 'https://iteystore.co.ke', search: 'https://iteystore.co.ke/search?q={q}' },
  { name: 'Digital Phones', years: 8, rating: 4.4, returns: 7, warranty: '6-mo', ship: 0.83, verified: true, website: 'https://digitalphones.co.ke', search: 'https://digitalphones.co.ke/?s={q}' },
  { name: 'Smartphones Planet', years: 4, rating: 4.2, returns: 7, warranty: '6-mo', ship: 0.78, verified: false, website: 'https://www.smartphonesplanet.co.ke', search: 'https://www.smartphonesplanet.co.ke/?s={q}' },
  { name: 'Mobile Hub', years: 6, rating: 4.3, returns: 7, warranty: '6-mo', ship: 0.81, verified: false, website: 'https://www.mobilehub.co.ke', search: 'https://www.mobilehub.co.ke/?s={q}' },
  { name: 'Silkroom', years: 5, rating: 4.4, returns: 14, warranty: '12-mo', ship: 0.84, verified: true, website: 'https://silkroom.odoo.com', search: 'https://silkroom.odoo.com/shop?search={q}' },
  // Appliance / TV retailers (carry fridges, washing machines, dishwashers, TVs, accessories).
  { name: 'Hotpoint', years: 20, rating: 4.6, returns: 7, warranty: '12-mo', ship: 0.9, verified: true, website: 'https://hotpoint.co.ke', search: 'https://hotpoint.co.ke/catalogsearch/result/?q={q}' },
  { name: 'Carrefour Kenya', years: 9, rating: 4.4, returns: 7, warranty: '12-mo', ship: 0.85, verified: true, website: 'https://www.carrefour.ke', search: 'https://www.carrefour.ke/mafken/en/search?keyword={q}' },
  { name: 'Kilimall KE', years: 10, rating: 4.2, returns: 7, warranty: '6-mo', ship: 0.8, verified: true, website: 'https://www.kilimall.co.ke', search: 'https://www.kilimall.co.ke/new/commodities/searchView?keyword={q}' },
];

export const CITIES = ['Nairobi', 'Mombasa', 'Kisumu'];
