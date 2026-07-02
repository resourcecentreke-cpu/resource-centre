#!/usr/bin/env node
/**
 * Fetch product photos from eBay (clean stock-style listing photos), with an
 * Amazon fallback. Replaces the cluttered marketplace collages: it rejects
 * accessory listings ("charger FOR HP Victus", "case for iPhone…") that the
 * name-matcher used to pick up.
 *
 * Run on YOUR machine (Node 18+):
 *     node scripts/shop-images.mjs --dry                 # preview matches
 *     node scripts/shop-images.mjs                       # fill missing photos
 *     node scripts/shop-images.mjs --from-report         # REDO everything that
 *                                                        #   came from Jumia
 *     node scripts/shop-images.mjs --only=slug-a,slug-b --force
 *     node scripts/shop-images.mjs --limit=10
 *
 * Writes shop-images-report.csv (slug, source, status, matched title).
 * AliExpress is intentionally not a source — it blocks scripted requests.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'apps', 'web', 'public', 'products');
const CATALOGUE = JSON.parse(readFileSync(join(ROOT, 'packages', 'db', 'data', 'catalogue.json'), 'utf8'));
const FILENAMES = join(ROOT, 'product-photo-filenames.csv');
const JUMIA_REPORT = join(ROOT, 'jumia-images-report.csv');

const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force') || process.argv.includes('--from-report');
const FROM_REPORT = process.argv.includes('--from-report');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const ONLY = ((process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── CSV helpers ──────────────────────────────────────────────────────────────
function parseCsvLine(line) {
  const cells = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { cells.push(cur); cur = ''; }
    else cur += ch;
  }
  cells.push(cur);
  return cells;
}
const slugByName = {};
for (const line of readFileSync(FILENAMES, 'utf8').split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  const c = parseCsvLine(line);
  if (c[1] && c[2]) slugByName[c[1]] = c[2];
}

// ── target selection ─────────────────────────────────────────────────────────
let targets = CATALOGUE.filter((it) => !it.img)
  .map((it) => ({ cat: it.cat, name: it.name, slug: slugByName[it.name] }))
  .filter((t) => t.slug);

if (FROM_REPORT) {
  // redo only the slugs Jumia filled (their photos are the cluttered ones)
  const redoSlugs = new Set();
  if (existsSync(JUMIA_REPORT)) {
    for (const line of readFileSync(JUMIA_REPORT, 'utf8').split(/\r?\n/).slice(1)) {
      const c = parseCsvLine(line);
      if (c[1] === 'ok') redoSlugs.add(c[0]);
    }
  }
  targets = targets.filter((t) => redoSlugs.has(t.slug));
}
if (ONLY.length) targets = targets.filter((t) => ONLY.includes(t.slug));
if (LIMIT) targets = targets.slice(0, LIMIT);

mkdirSync(OUT, { recursive: true });
console.log(`${targets.length} product(s) to fetch → ${OUT}\n`);

// ── matching ─────────────────────────────────────────────────────────────────
const norm = (s) =>
  s.toLowerCase()
    .replace(/["“”″]/g, ' inch ')
    .replace(/\+/g, ' plus ')
    .replace(/[()\[\],·|]/g, ' ')
    .replace(/[^a-z0-9. ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const STOP = new Set(['inch', 'the', 'with', 'and', 'gen', '2nd', '3rd', 'true', 'wireless', 'smart', 'digital', 'refurbished', 'new']);
const tokens = (n) => norm(n).split(' ').filter((t) => t && !STOP.has(t));
const isYear = (t) => /^(19|20)\d{2}$/.test(t);

// Listings that are accessories FOR the product, not the product itself.
const ACCESSORY_WORDS = [
  'case', 'cover', 'pouch', 'sleeve', 'skin', 'protector', 'tempered', 'films',
  'charger', 'adapter', 'cable', 'replacement', 'strap', 'band', 'mount',
  'stand', 'holder', 'dock', 'hub', 'stylus', 'keyboard cover', 'screen guard',
  'battery for', 'parts', 'repair', 'motherboard', 'hinge', 'bezel', 'fan',
];
function isAccessoryListing(productName, title) {
  const p = norm(productName);
  const t = norm(title);
  if (/\bfor\b/.test(t) && !/\bfor\b/.test(p)) return true;
  return ACCESSORY_WORDS.some((w) => t.includes(w) && !p.includes(w));
}

function scoreMatch(productName, title) {
  if (isAccessoryListing(productName, title)) return 0;
  const want = tokens(productName);
  const haveRaw = tokens(title);
  const have = new Set(haveRaw);
  const hj = haveRaw.join(' ');
  if (!want.length) return 0;
  let hit = 0;
  for (const t of want) {
    if (have.has(t)) { hit++; continue; }
    if (t.length >= 2 && haveRaw.some((h) => h.includes(t))) hit += 0.5;
  }
  const digits = want.filter((t) => /\d/.test(t) && !isYear(t));
  for (const d of digits) {
    const num = d.match(/\d+/)[0];
    if (!hj.includes(num)) return 0;
  }
  return hit / want.length;
}

const buildQuery = (name) => tokens(name).filter((t) => !isYear(t)).slice(0, 6).join(' ');

// ── sources ──────────────────────────────────────────────────────────────────
async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*', 'Accept-Language': 'en-US,en' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function ebayCards(html) {
  if (/pardon our interruption|verify yourself/i.test(html)) throw new Error('ebay bot-check');
  const cards = [];
  const items = html.match(/<li[^>]*class="[^"]*s-item[^"]*"[\s\S]*?<\/li>/gi) || [];
  for (const it of items) {
    const img =
      (it.match(/(?:data-)?src="(https:\/\/i\.ebayimg\.com\/[^"]+)"/) || [])[1];
    const title =
      (it.match(/class="s-item__title"[^>]*>(?:<span[^>]*>)?([\s\S]*?)<\/(?:span|div)>/i) || [])[1];
    if (!img || !title) continue;
    const clean = title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^shop on ebay$/i.test(clean)) continue; // eBay's placeholder card
    cards.push({ img, title: clean });
  }
  return cards;
}
const ebayBig = (u) => u.replace(/s-l\d+/, 's-l1600').replace(/\.webp$/, '.jpg');

function amazonCards(html) {
  if (/api-services-support@amazon|Robot Check|captcha/i.test(html)) throw new Error('amazon bot-check');
  const cards = [];
  const re = /<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"[^>]+alt="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) cards.push({ img: m[1], title: m[2] });
  return cards;
}
const amazonBig = (u) => u.replace(/\._[^.]+_\./, '.');

const SOURCES = [
  { name: 'ebay', url: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&_ipg=60`, parse: ebayCards, big: ebayBig },
  { name: 'amazon', url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`, parse: amazonCards, big: amazonBig },
];

async function fetchImage(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4096) throw new Error(`image too small (${buf.length}B)`);
  writeFileSync(dest, buf);
  return buf.length;
}

// ── main ─────────────────────────────────────────────────────────────────────
const report = [['slug', 'source', 'status', 'matched_title']];
let ok = 0, miss = 0, fail = 0, skip = 0;

for (const t of targets) {
  const dest = join(OUT, `${t.slug}.jpg`);
  if (!FORCE && existsSync(dest)) { skip++; continue; }
  const q = buildQuery(t.name);
  let done = false;
  let lastErr = '';
  for (const src of SOURCES) {
    try {
      const html = await fetchText(src.url(q));
      const ranked = src.parse(html)
        .map((c) => ({ ...c, score: scoreMatch(t.name, c.title) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (!best || best.score < 0.55) { lastErr = `no confident match on ${src.name}`; continue; }
      if (DRY) {
        console.log(`🔎 ${t.slug}  [${src.name} ${best.score.toFixed(2)}]  ${best.title.slice(0, 80)}`);
        report.push([t.slug, src.name, 'dry-match', best.title]);
      } else {
        const bytes = await fetchImage(src.big(best.img), dest);
        console.log(`✅ ${t.slug}  [${src.name}] (${Math.round(bytes / 1024)} KB)  ${best.title.slice(0, 70)}`);
        report.push([t.slug, src.name, 'ok', best.title]);
      }
      ok++; done = true;
      break;
    } catch (e) {
      lastErr = `${src.name}: ${e.message}`;
    }
    await sleep(800);
  }
  if (!done) {
    console.log(`⚠️  ${t.slug}  ${lastErr}`);
    report.push([t.slug, '', 'no-match', lastErr]);
    miss++;
  }
  await sleep(1500); // stay polite
}

writeFileSync(
  join(ROOT, 'shop-images-report.csv'),
  report.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'),
);
console.log(`\nDone: ${ok} fetched · ${miss} no-match · ${fail} failed · ${skip} skipped — report: shop-images-report.csv`);
if (miss) console.log('For stubborn items, add a page URL to product-page-urls.csv and run fetch-og-images.mjs.');
