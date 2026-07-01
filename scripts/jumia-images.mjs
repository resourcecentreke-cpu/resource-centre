#!/usr/bin/env node
/**
 * Auto-fetch product photos from Jumia Kenya (a retailer whose offers the site
 * lists) for every product that has neither a catalogue image nor a local
 * photo. For each one it queries Jumia's catalog search, picks the best
 * name-match, and saves the product image as apps/web/public/products/<slug>.jpg.
 *
 * Run on YOUR machine (needs internet; Node 18+):
 *     node scripts/jumia-images.mjs --dry           # show matches, download nothing
 *     node scripts/jumia-images.mjs                 # download all matches
 *     node scripts/jumia-images.mjs --limit=10      # first 10 only (test run)
 *     node scripts/jumia-images.mjs --only=slug-a,slug-b
 *     node scripts/jumia-images.mjs --force         # re-download existing files
 *
 * Every run writes jumia-images-report.csv (slug, status, matched title, url)
 * — eyeball it after a run and fix any wrong matches by deleting the file and
 * adding a manual page URL to product-page-urls.csv (see fetch-og-images.mjs).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'apps', 'web', 'public', 'products');
const CATALOGUE = JSON.parse(readFileSync(join(ROOT, 'packages', 'db', 'data', 'catalogue.json'), 'utf8'));
const FILENAMES = join(ROOT, 'product-photo-filenames.csv');

const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const ONLY = ((process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// ── name → slug map from product-photo-filenames.csv (handles quoted names) ──
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

// ── products that still need a photo ─────────────────────────────────────────
let targets = CATALOGUE.filter((it) => !it.img)
  .map((it) => ({ cat: it.cat, name: it.name, slug: slugByName[it.name] }))
  .filter((t) => t.slug);
if (ONLY.length) targets = targets.filter((t) => ONLY.includes(t.slug));
if (LIMIT) targets = targets.slice(0, LIMIT);

mkdirSync(OUT, { recursive: true });
console.log(`${targets.length} product(s) need photos → ${OUT}\n`);

// ── matching helpers ─────────────────────────────────────────────────────────
const norm = (s) =>
  s.toLowerCase()
    .replace(/["“”″]/g, ' inch ')
    .replace(/\+/g, ' plus ')
    .replace(/[()\[\],·|]/g, ' ')
    .replace(/[^a-z0-9. ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STOP = new Set(['inch', 'the', 'with', 'and', 'gen', '2nd', '3rd', 'true', 'wireless', 'smart', 'digital', 'refurbished']);

function tokens(name) {
  return norm(name).split(' ').filter((t) => t && !STOP.has(t));
}

function scoreMatch(productName, candidateTitle) {
  const want = tokens(productName);
  const have = new Set(tokens(candidateTitle));
  if (!want.length) return 0;
  let hit = 0;
  for (const t of want) {
    if (have.has(t)) { hit++; continue; }
    // "43" should match "43inch"/"43-inch" style joins
    if ([...have].some((h) => h.includes(t) && t.length >= 2)) hit += 0.5;
  }
  // digit tokens (sizes, model numbers) are non-negotiable
  const digits = want.filter((t) => /\d/.test(t));
  for (const d of digits) {
    if (!have.has(d) && ![...have].some((h) => h.includes(d))) return 0;
  }
  return hit / want.length;
}

// ── Jumia fetch + parse ──────────────────────────────────────────────────────
async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*', 'Accept-Language': 'en' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseCards(html) {
  const cards = [];
  const articles = html.match(/<article[^>]*class="[^"]*prd[^"]*"[\s\S]*?<\/article>/gi) || [];
  for (const a of articles) {
    const href = (a.match(/href="(\/[^"]+\.html)"/) || [])[1];
    const img =
      (a.match(/data-src="(https:\/\/[^"]+jumia\.is[^"]+)"/) || [])[1] ||
      (a.match(/src="(https:\/\/[^"]+jumia\.is[^"]+)"/) || [])[1];
    const title =
      (a.match(/<h3[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</i) || [])[1] ||
      (a.match(/\bname="([^"]+)"/) || [])[1];
    if (href && img && title) cards.push({ href, img, title: title.trim() });
  }
  // generic fallback if Jumia changes markup
  if (!cards.length) {
    const re = /href="(\/[^"]+\.html)"[\s\S]{0,600}?(?:data-)?src="(https:\/\/[^"]+jumia\.is[^"]+)"[\s\S]{0,400}?>([^<]{10,150})</gi;
    let m;
    while ((m = re.exec(html))) cards.push({ href: m[1], img: m[2], title: m[3].trim() });
  }
  return cards;
}

const bigImage = (u) => u.replace(/fit-in\/\d+x\d+/, 'fit-in/680x680');

async function fetchImage(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4096) throw new Error(`image too small (${buf.length}B)`);
  writeFileSync(dest, buf);
  return buf.length;
}

// ── main loop ────────────────────────────────────────────────────────────────
const report = [['slug', 'status', 'matched_title', 'detail']];
let ok = 0, weak = 0, fail = 0, skip = 0;

for (const t of targets) {
  const dest = join(OUT, `${t.slug}.jpg`);
  if (!FORCE && existsSync(dest)) { skip++; continue; }
  const q = encodeURIComponent(norm(t.name));
  try {
    const html = await fetchText(`https://www.jumia.co.ke/catalog/?q=${q}`);
    const cards = parseCards(html);
    if (!cards.length) throw new Error('no product cards parsed');
    const ranked = cards
      .map((c) => ({ ...c, score: scoreMatch(t.name, c.title) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best || best.score < 0.5) {
      report.push([t.slug, 'no-match', best?.title || '', `best score ${best ? best.score.toFixed(2) : 0}`]);
      console.log(`⚠️  ${t.slug}  no confident match (best: "${best?.title || '—'}")`);
      weak++;
    } else if (DRY) {
      console.log(`🔎 ${t.slug}  [${best.score.toFixed(2)}]  ${best.title}`);
      report.push([t.slug, 'dry-match', best.title, bigImage(best.img)]);
      ok++;
    } else {
      const bytes = await fetchImage(bigImage(best.img), dest);
      console.log(`✅ ${t.slug}  (${Math.round(bytes / 1024)} KB)  "${best.title}"`);
      report.push([t.slug, 'ok', best.title, bigImage(best.img)]);
      ok++;
    }
  } catch (e) {
    console.log(`❌ ${t.slug}  ${e.message}`);
    report.push([t.slug, 'fail', '', e.message]);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 1200)); // be polite
}

writeFileSync(
  join(ROOT, 'jumia-images-report.csv'),
  report.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'),
);
console.log(`\nDone: ${ok} matched · ${weak} no-match · ${fail} failed · ${skip} skipped`);
console.log('Review jumia-images-report.csv. For no-match items, add a page URL to product-page-urls.csv and run fetch-og-images.mjs.');
