import type { ProductDetailDTO } from '@rc/types';
import { fmtKES } from './format';
import { deviceAge, releasedLabel } from './age';

export interface SpecRow {
  label: string;
  value: string;
}

/** Label a "·"-separated spec token by detecting what it describes. */
function labelToken(token: string): string {
  const s = token.toLowerCase();
  if (/(\d+(\.\d+)?\s*("|”|inch))|amoled|oled|lcd|qled|uled|retina|ips|p-?oled|tandem|liquid|crystal|neo/.test(s))
    return 'Display';
  if (/snapdragon|\bsd\s?\d|dimensity|helio|exynos|tensor|core\s?(i|ultra)|ryzen|\bm[1-5]\b|unisoc|\ba1[0-9]/.test(s))
    return 'Processor / chipset';
  if (/\bmp\b|megapixel|camera|tele|hasselblad|zeiss|leica/.test(s)) return 'Camera';
  if (/mah/.test(s)) return 'Battery';
  if (/\b\d+\s?w\b|watt|\bpd\b|charging/.test(s)) return 'Charging';
  if (/\b\d+\s?(gb|tb)\b|ram|storage/.test(s)) return 'Memory / storage';
  if (/\b5g\b|wifi|wi-fi|\b4g\b/.test(s)) return 'Connectivity';
  if (/place|kg|load|litre|liter|\bl\b|door|inverter|freezer/.test(s)) return 'Capacity / type';
  if (/anc|tws|earbud|over-ear|driver|hi-res|speaker|bluetooth|bt\b/.test(s)) return 'Audio';
  return 'Feature';
}

/** Build a structured spec sheet from the product's summary + known fields. */
export function buildSpecSheet(p: ProductDetailDTO): SpecRow[] {
  const rows: SpecRow[] = [{ label: 'Brand', value: p.brand }];

  // Release date + precise device age (e.g. "1 year 3 months old"), GSM-Arena style.
  const rel = releasedLabel(p.releaseDate);
  if (rel) rows.push({ label: 'Released', value: rel.replace(/^Released\s+/, '') });
  const age = deviceAge(p.releaseDate);
  if (age) rows.push({ label: 'Age', value: age.isUpcoming ? age.label : `${age.label} (since launch)` });

  const tokens = p.specSummary.split('·').map((t) => t.trim()).filter(Boolean);
  const used: Record<string, number> = {};
  for (const t of tokens) {
    let label = labelToken(t);
    // disambiguate repeated labels (e.g. two "Feature" rows)
    used[label] = (used[label] ?? 0) + 1;
    if (used[label] > 1) label = `${label} (${used[label]})`;
    rows.push({ label, value: t });
  }

  rows.push({ label: 'Category', value: p.category });

  const condition = (p.specs?.condition as string) || 'New';
  rows.push({ label: 'Condition', value: condition });
  if (condition === 'Refurbished') {
    if (p.specs?.battery) rows.push({ label: 'Battery health', value: String(p.specs.battery) });
    if (typeof p.specs?.cycles === 'number') rows.push({ label: 'Charge cycles', value: String(p.specs.cycles) });
  }

  rows.push({ label: 'Best price', value: fmtKES(p.minPrice) });
  if (p.maxPrice && p.maxPrice > p.minPrice) {
    rows.push({ label: 'Price range', value: `${fmtKES(p.minPrice)} – ${fmtKES(p.maxPrice)}` });
  }
  rows.push({ label: 'Listed at', value: `${p.offerCount} store${p.offerCount === 1 ? '' : 's'}` });
  const inStock = p.offers.some((o) => o.inStock !== 'out');
  rows.push({ label: 'Availability', value: inStock ? 'In stock' : 'Currently out of stock' });

  return rows;
}

/** Heuristic, honest pros & cons derived from real signals on the product. */
export function buildProsCons(p: ProductDetailDTO): { pros: string[]; cons: string[] } {
  const text = `${p.name} ${p.specSummary}`.toLowerCase();
  const pros: string[] = [];
  const cons: string[] = [];

  const condition = (p.specs?.condition as string) || 'New';
  const mah = Number((text.match(/(\d{4,5})\s*mah/) || [])[1] || 0);
  const watt = Number((text.match(/(\d{2,3})\s*w\b/) || [])[1] || 0);
  const mp = Number((text.match(/(\d{2,3})\s*mp/) || [])[1] || 0);
  const hz = Number((text.match(/(\d{2,3})\s*hz/) || [])[1] || 0);
  const inStockOffers = p.offers.filter((o) => o.inStock !== 'out').length;

  // ---- Pros ----
  if (p.isNew) pros.push('Recently released — current-generation model');
  if (/amoled|oled|uled|qled/.test(text)) pros.push('Vibrant AMOLED/OLED-class display');
  if (hz >= 90) pros.push(`Smooth ${hz}Hz high-refresh-rate screen`);
  if (/\b5g\b/.test(text)) pros.push('5G connectivity');
  if (mah >= 5000) pros.push(`Large ${mah.toLocaleString()}mAh battery for all-day use`);
  if (watt >= 45) pros.push(`Fast ${watt}W charging`);
  if (/sd\s?8|dimensity\s?9|tensor\s?g|core\s?ultra|ryzen\s?(7|9|ai)|\bm[2-5]\b|a1[789]\s?pro|elite/.test(text))
    pros.push('Powerful flagship-class performance');
  if (/256gb|512gb|1tb/.test(text)) pros.push('Plenty of storage');
  if (mp >= 108) pros.push(`High-resolution ${mp}MP camera`);
  if (condition === 'Refurbished') pros.push('More affordable than buying brand-new');
  if (p.offerCount >= 5) pros.push(`Widely stocked — compare ${p.offerCount} sellers here`);

  // value vs similar devices (rough proxy using the related list)
  const sims = p.similar.map((s) => s.minPrice).filter((n) => n > 0);
  if (sims.length >= 2) {
    const avg = sims.reduce((a, b) => a + b, 0) / sims.length;
    if (p.minPrice < avg * 0.9) pros.push('Priced below similar devices — good value');
  }

  // ---- Cons ----
  if (condition === 'Refurbished') {
    const bits = [];
    if (p.specs?.battery) bits.push(`battery at ${p.specs.battery}`);
    if (typeof p.specs?.cycles === 'number') bits.push(`${p.specs.cycles} charge cycles`);
    cons.push(`Refurbished unit${bits.length ? ` — ${bits.join(', ')}` : ' — expect some wear'}`);
  }
  const premium =
    (p.category === 'Smartphones' && p.minPrice > 90000) ||
    (p.category === 'Laptops' && p.minPrice > 130000) ||
    (p.category === 'TVs' && p.minPrice > 90000) ||
    p.minPrice > 110000;
  if (premium) cons.push('Premium price point');
  if (!p.isNew && condition !== 'Refurbished') cons.push('Not the newest model in its line');
  if (/unisoc|helio\s?g[0-9]{2}\b/.test(text) && !/dimensity|snapdragon/.test(text))
    cons.push('Entry-level processor — best for everyday tasks');
  if (mah > 0 && mah < 4000 && p.category === 'Smartphones') cons.push('Smaller battery capacity');
  if (inStockOffers === 0) cons.push('Currently out of stock at listed sellers');
  else if (inStockOffers === 1) cons.push('Limited availability — only one seller in stock');

  // ---- Fallbacks so each list is useful ----
  if (pros.length < 2) {
    pros.push('Compared across multiple trusted Kenyan stores');
    pros.push('Price history tracked so you can time your purchase');
  }
  if (cons.length === 0) {
    cons.push('Prices are indicative — confirm final price and warranty on the retailer’s page');
  }

  return { pros: pros.slice(0, 6), cons: cons.slice(0, 5) };
}
