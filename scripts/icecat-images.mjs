#!/usr/bin/env node
/**
 * Fetch manufacturer-authorized product images from Open Icecat and save them
 * locally as apps/web/public/products/<slug>.jpg.
 *
 * Icecat content is licensed for resellers to display, so this is the
 * copyright-safe way to populate product photos in bulk.
 *
 * ── Setup ───────────────────────────────────────────────────────────────────
 * 1. Register (free) for Open Icecat: https://icecat.com  → My Icecat → Access Tokens
 * 2. Set credentials in the environment (NOT in code):
 *        export ICECAT_USERNAME="your-icecat-username"
 *        export ICECAT_API_TOKEN="xxxxxxxx"        # "api-token" header
 *        export ICECAT_CONTENT_TOKEN="xxxxxxxx"    # "content-token" header (images)
 *    (If you only have one token, set it as BOTH — many accounts use one.)
 * 3. Edit ./icecat-map.csv  (header: slug,brand,product_code,gtin)
 *    - For best matches, fill `gtin` (the barcode on the box / retailer page) OR
 *      the exact manufacturer `product_code` (MPN). The pre-filled product_code
 *      is a best-effort guess from the name and will miss for many items.
 *
 * ── Run (needs internet; Node 18+) ──────────────────────────────────────────
 *        node scripts/icecat-images.mjs --dry      # look up, report hits/misses, no download
 *        node scripts/icecat-images.mjs            # download images for all hits
 *        node scripts/icecat-images.mjs --only=samsung-galaxy-s26-ultra,iphone-17-pro-max
 *
 * Output: images in apps/web/public/products/, and a report at ./icecat-report.csv
 * Then rsync apps/web/public/products to the server (no rebuild needed).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV = join(ROOT, 'icecat-map.csv');
const OUT = join(ROOT, 'apps', 'web', 'public', 'products');
const REPORT = join(ROOT, 'icecat-report.csv');

const DRY = process.argv.includes('--dry');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim())) : null;

const USER = process.env.ICECAT_USERNAME;
const API_TOKEN = process.env.ICECAT_API_TOKEN || process.env.ICECAT_TOKEN;
const CONTENT_TOKEN = process.env.ICECAT_CONTENT_TOKEN || process.env.ICECAT_TOKEN;
const APP_KEY = process.env.ICECAT_APP_KEY || ''; // Full Icecat key from My Profile (optional)

if (!USER) {
  console.error('Missing ICECAT_USERNAME. Set it to your Icecat username (My Icecat → top of profile).');
  process.exit(1);
}
if (!API_TOKEN) {
  console.error('Missing ICECAT_API_TOKEN (or ICECAT_TOKEN). Get it from My Icecat → Access Tokens.');
  process.exit(1);
}
if (!existsSync(CSV)) {
  console.error(`Missing ${CSV} (header: slug,brand,product_code,gtin).`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

function parseCsv(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(',').map((c) => c.trim());
  return lines.filter(Boolean).map((line) => {
    // naive CSV (no embedded commas expected in these fields)
    const cells = line.split(',');
    const row = {};
    cols.forEach((c, i) => (row[c] = (cells[i] ?? '').trim()));
    return row;
  });
}

// Pull the best image URL out of an Icecat JSON datasheet, defensively.
function pickImage(data) {
  const d = data?.data ?? data;
  const cand = [];
  const img = d?.Image || d?.GeneralInfo?.Image;
  if (img) cand.push(img.HighPic, img.Pic500x500, img.LowPic, img.Pic, img.ThumbPic);
  const gallery = d?.Gallery || d?.Multimedia?.Gallery;
  if (Array.isArray(gallery)) {
    for (const g of gallery) cand.push(g.Pic, g.Pic500x500, g.LowPic, g.ThumbPic);
  }
  return cand.find((u) => typeof u === 'string' && /^https?:\/\//.test(u)) || null;
}

function buildUrl(row) {
  const base = 'https://live.icecat.biz/api';
  const p = new URLSearchParams({ lang: 'EN', shopname: USER, content: 'image,gallery,generalinfo' });
  if (APP_KEY) p.set('app_key', APP_KEY);
  if (row.gtin) p.set('GTIN', row.gtin);
  else { p.set('Brand', row.brand); p.set('ProductCode', row.product_code); }
  return `${base}?${p.toString()}`;
}

async function lookup(row) {
  const url = buildUrl(row);
  const res = await fetch(url, {
    headers: { 'api-token': API_TOKEN, 'content-token': CONTENT_TOKEN, Accept: 'application/json' },
  });
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
  let json;
  try { json = await res.json(); } catch { return { ok: false, reason: 'bad json' }; }
  if (json?.statusCode && json.statusCode !== 0 && json?.message) return { ok: false, reason: json.message };
  let img = pickImage(json);
  if (!img) return { ok: false, reason: 'no image in datasheet' };
  if (CONTENT_TOKEN && !img.includes('content_token=')) {
    img += (img.includes('?') ? '&' : '?') + 'content_token=' + encodeURIComponent(CONTENT_TOKEN);
  }
  return { ok: true, img };
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

const rows = parseCsv(readFileSync(CSV, 'utf8')).filter((r) => r.slug && (ONLY ? ONLY.has(r.slug) : true));
const report = [['slug', 'brand', 'identifier', 'status', 'detail']];
let hits = 0, miss = 0;

console.log(`Icecat: ${rows.length} products${DRY ? ' (dry run)' : ''}\n`);
for (const row of rows) {
  const id = row.gtin ? `GTIN ${row.gtin}` : `${row.brand} ${row.product_code}`;
  try {
    const r = await lookup(row);
    if (!r.ok) { miss++; report.push([row.slug, row.brand, id, 'miss', r.reason]); console.log(`✗ ${row.slug} — ${r.reason}`); continue; }
    if (DRY) { hits++; report.push([row.slug, row.brand, id, 'found', r.img]); console.log(`✓ ${row.slug} — image found`); continue; }
    const bytes = await download(r.img, join(OUT, `${row.slug}.jpg`));
    hits++; report.push([row.slug, row.brand, id, 'saved', `${Math.round(bytes / 1024)} KB`]);
    console.log(`✓ ${row.slug} — saved ${Math.round(bytes / 1024)} KB`);
  } catch (e) {
    miss++; report.push([row.slug, row.brand, id, 'error', String(e.message || e)]);
    console.log(`✗ ${row.slug} — ${e.message || e}`);
  }
  await new Promise((r) => setTimeout(r, 250)); // be gentle on the API
}

writeFileSync(REPORT, report.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'));
console.log(`\nDone. hits=${hits} miss=${miss}. Report → ${REPORT}`);
console.log(miss ? 'For misses, add the GTIN (barcode) or exact product_code in icecat-map.csv and re-run.' : '');
