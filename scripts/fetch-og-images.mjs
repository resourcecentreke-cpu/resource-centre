#!/usr/bin/env node
/**
 * Download product photos from PRODUCT PAGE URLs (retailer or manufacturer).
 *
 * Unlike download-product-images.mjs (which needs direct image URLs), this
 * script takes the page URL of each product and extracts the main product
 * image itself (og:image → twitter:image → JSON-LD "image"), then saves it as
 * apps/web/public/products/<slug>.jpg.
 *
 * Use pages you're entitled to pull from: the retailer that lists the product
 * (you display their offer) or the manufacturer's official page — per
 * photo-sources-directory.md.
 *
 * 1. Fill ./product-page-urls.csv  (header: slug,page_url)
 * 2. Run on YOUR machine (needs internet; Node 18+):
 *        node scripts/fetch-og-images.mjs
 *        node scripts/fetch-og-images.mjs --dry        # list only
 *        node scripts/fetch-og-images.mjs --force      # re-download existing
 * 3. rsync apps/web/public/products/ to the server (docs/product-photos.md).
 *    No rebuild needed.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV = join(ROOT, 'product-page-urls.csv');
const OUT = join(ROOT, 'apps', 'web', 'public', 'products');
const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

if (!existsSync(CSV)) {
  console.error(`Missing ${CSV}\nCreate it with a header "slug,page_url" and one row per product.`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const header = lines.shift().split(',').map((h) => h.trim().toLowerCase());
  const si = header.indexOf('slug');
  const ui = header.indexOf('page_url');
  if (si === -1 || ui === -1) throw new Error('CSV must have "slug" and "page_url" columns');
  return lines.map((line) => {
    const cells = line
      .match(/("([^"]|"")*"|[^,]*)(,|$)/g)
      .map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    return { slug: cells[si], url: cells[ui] };
  });
}

const meta = (html, name) => {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
    'i',
  );
  const m = html.match(re);
  return m ? (m[1] || m[2]) : null;
};

function jsonLdImage(html) {
  const blocks = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const b of blocks) {
    try {
      const body = b.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
      const data = JSON.parse(body);
      const nodes = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])];
      for (const n of nodes) {
        if (!n) continue;
        const img = n.image;
        if (typeof img === 'string') return img;
        if (Array.isArray(img) && img.length) return typeof img[0] === 'string' ? img[0] : img[0]?.url;
        if (img && typeof img === 'object' && img.url) return img.url;
      }
    } catch { /* skip malformed blocks */ }
  }
  return null;
}

// Skip obvious non-product images (logos, sprites, placeholders).
const looksGeneric = (u) => /logo|sprite|placeholder|favicon|default[-_]/i.test(u);

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchImage(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`not an image (${type})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4096) throw new Error(`too small (${buf.length}B) — probably a placeholder`);
  writeFileSync(dest, buf);
  return buf.length;
}

const rows = parseCsv(readFileSync(CSV, 'utf8')).filter((r) => r.slug && r.url);
console.log(`${rows.length} product page(s) to process → ${OUT}\n`);

const report = [['slug', 'status', 'detail']];
let ok = 0, fail = 0, skip = 0;

for (const { slug, url } of rows) {
  const dest = join(OUT, `${slug}.jpg`);
  if (!FORCE && existsSync(dest)) { console.log(`⏭  ${slug} (exists)`); skip++; continue; }
  if (DRY) { console.log(`would fetch ${slug}  <-  ${url}`); skip++; continue; }
  try {
    const html = await fetchText(url);
    const candidates = [meta(html, 'og:image'), meta(html, 'og:image:secure_url'), meta(html, 'twitter:image'), jsonLdImage(html)]
      .filter(Boolean)
      .map((u) => new URL(u, url).href)
      .filter((u) => !looksGeneric(u));
    if (!candidates.length) throw new Error('no og:image / twitter:image / JSON-LD image found');
    let saved = null, lastErr = null;
    for (const c of candidates) {
      try { saved = { url: c, bytes: await fetchImage(c, dest) }; break; }
      catch (e) { lastErr = e; }
    }
    if (!saved) throw lastErr || new Error('all candidates failed');
    console.log(`✅ ${slug}  (${Math.round(saved.bytes / 1024)} KB)  <-  ${saved.url}`);
    report.push([slug, 'ok', saved.url]);
    ok++;
  } catch (e) {
    console.log(`❌ ${slug}  ${e.message}  (${url})`);
    report.push([slug, 'fail', `${e.message} @ ${url}`]);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 800)); // be polite to the source
}

writeFileSync(join(ROOT, 'product-page-images-report.csv'), report.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'));
console.log(`\nDone: ${ok} ok · ${fail} failed · ${skip} skipped — report: product-page-images-report.csv`);
