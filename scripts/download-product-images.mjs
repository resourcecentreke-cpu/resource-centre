#!/usr/bin/env node
/**
 * Download product images from a list of URLs into apps/web/public/products/.
 *
 * Use this with image URLs you have the RIGHT to use — your own photos, a
 * distributor/retailer asset pack, or an affiliate product feed. Do not bulk-copy
 * images from shops or manufacturer sites you haven't been licensed by.
 *
 * 1. Create a CSV next to this repo's root named `product-image-urls.csv` with a
 *    header row and two columns:
 *
 *        slug,image_url
 *        dell-xps-13-2025,https://your-source.example/dell-xps-13.jpg
 *        sony-wf-c710n,https://your-source.example/sony.png
 *
 *    (Copy the `slug` values from product-photo-filenames.csv.)
 *
 * 2. Run on YOUR machine (needs internet; Node 18+):
 *        node scripts/download-product-images.mjs
 *        node scripts/download-product-images.mjs --dry      # list only, no download
 *
 * Files are saved as apps/web/public/products/<slug>.jpg. Then rsync that folder
 * to the server (see docs/product-photos.md) — no rebuild needed.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV = join(ROOT, 'product-image-urls.csv');
const OUT = join(ROOT, 'apps', 'web', 'public', 'products');
const DRY = process.argv.includes('--dry');

if (!existsSync(CSV)) {
  console.error(`Missing ${CSV}\nCreate it with a header "slug,image_url" and one row per image.`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

// minimal CSV parse (handles simple quoted fields)
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines.shift().split(',').map((h) => h.trim().toLowerCase());
  const si = header.indexOf('slug');
  const ui = header.indexOf('image_url');
  if (si === -1 || ui === -1) throw new Error('CSV must have "slug" and "image_url" columns');
  return lines.map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    return { slug: cells[si], url: cells[ui] };
  });
}

const rows = parseCsv(readFileSync(CSV, 'utf8')).filter((r) => r.slug && r.url);
console.log(`${rows.length} image(s) to fetch → ${OUT}`);

let ok = 0, fail = 0, skip = 0;
for (const { slug, url } of rows) {
  const dest = join(OUT, `${slug}.jpg`);
  if (DRY) { console.log(`would download ${slug}  <-  ${url}`); skip++; continue; }
  try {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 ResourceCentre image fetch' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // eslint-disable-next-line no-await-in-loop
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error('suspiciously small file');
    writeFileSync(dest, buf);
    console.log(`✓ ${slug}.jpg  (${Math.round(buf.length / 1024)} KB)`);
    ok++;
  } catch (e) {
    console.warn(`✗ ${slug}: ${e.message}`);
    fail++;
  }
}
console.log(`\ndone — saved=${ok} failed=${fail} ${DRY ? `(dry, ${skip} listed)` : ''}`);
if (ok) console.log('Next: rsync apps/web/public/products/ to the server (see docs/product-photos.md).');
