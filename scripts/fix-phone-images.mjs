#!/usr/bin/env node
/**
 * Verify & repair phone/tablet image slugs against GSM Arena's image CDN.
 *
 * The build sandbox can't reach manufacturer/GSM CDNs, so image slugs added
 * there are best-effort. Run this on YOUR machine (it has internet):
 *
 *     node scripts/fix-phone-images.mjs            # verify + repair, write back
 *     node scripts/fix-phone-images.mjs --dry      # report only, no writes
 *
 * For each Phones/Tablets product it checks the bigpic URL; if it 404s it tries
 * a handful of slug variants (±"-5g", brand prefixes, "plus"/"pro" forms). A
 * working variant is saved; anything still broken has its img cleared to ""
 * (the UI then shows a clean brand fallback instead of a broken image icon).
 *
 * Requires Node 18+ (global fetch). No dependencies.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAT = join(__dirname, '..', 'packages', 'db', 'data', 'catalogue.json');
const BIG = (slug) => `https://fdn2.gsmarena.com/vv/bigpic/${slug}.jpg`;
const DRY = process.argv.includes('--dry');
const CATS = new Set(['Phones', 'Tablets', 'Smart Watches']);

const slugify = (s) =>
  s.toLowerCase()
    .replace(/\(([^)]+)\)/g, ' $1 ')
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const brandPrefix = (name) => {
  const n = name.toLowerCase();
  if (n.startsWith('iphone') || n.startsWith('ipad') || n.startsWith('apple')) return 'apple-';
  if (n.startsWith('galaxy')) return 'samsung-galaxy-';
  if (n.startsWith('pixel')) return 'google-';
  if (n.startsWith('redmi') || n.startsWith('poco')) return 'xiaomi-';
  return '';
};

function variants(item) {
  const out = new Set();
  if (item.img) {
    out.add(item.img);
    out.add(item.img.endsWith('-5g') ? item.img.slice(0, -3) : `${item.img}-5g`);
  }
  const base = slugify(item.name);
  out.add(base);
  out.add(`${base}-5g`);
  const bp = brandPrefix(item.name);
  if (bp) {
    out.add(`${bp}${slugify(item.name.replace(/^(galaxy|pixel)\s+/i, ''))}`);
    out.add(`${bp}${base}`);
  }
  return [...out].filter(Boolean);
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Probe a slug on the CDN. Returns 'yes' | 'no' | 'blocked'. */
async function probe(slug) {
  try {
    const res = await fetch(BIG(slug), {
      method: 'GET',
      headers: { Range: 'bytes=0-0', 'User-Agent': UA, Referer: 'https://www.gsmarena.com/' },
    });
    if (res.status === 200 || res.status === 206) return 'yes';
    if (res.status === 404) return 'no';
    return 'blocked'; // 403/429/5xx — rate-limited, NOT proof the image is missing
  } catch {
    return 'blocked';
  }
}

const data = JSON.parse(readFileSync(CAT, 'utf8'));
let kept = 0, repaired = 0, cleared = 0, skipped = 0, throttled = 0;

for (const item of data) {
  if (!CATS.has(item.cat)) { skipped++; continue; }
  const tries = variants(item);
  let found = '';
  let sawBlock = false;
  for (const slug of tries) {
    // eslint-disable-next-line no-await-in-loop
    const r = await probe(slug);
    if (r === 'yes') { found = slug; break; }
    if (r === 'blocked') {
      sawBlock = true;
      // back off hard once, then retry this slug a single time
      // eslint-disable-next-line no-await-in-loop
      await sleep(15000);
      // eslint-disable-next-line no-await-in-loop
      if ((await probe(slug)) === 'yes') { found = slug; break; }
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(400);
  }
  if (found && found === item.img) { kept++; }
  else if (found) { console.log(`fix  ${item.name}: ${item.img || '∅'} -> ${found}`); item.img = found; repaired++; }
  else if (sawBlock) {
    console.log(`⏸  ${item.name}: CDN throttled — left unchanged, re-run later`);
    throttled++;
  } else {
    if (item.img) { console.log(`clear ${item.name}: ${item.img} (confirmed 404)`); cleared++; }
    item.img = '';
  }
  // eslint-disable-next-line no-await-in-loop
  await sleep(1200); // stay under the CDN's rate limit
}

console.log(`\nkept=${kept} repaired=${repaired} cleared=${cleared} throttled=${throttled} skipped(non-phone/tablet)=${skipped}`);
if (throttled) console.log('⚠️  Some devices were throttled — run again in ~10 minutes to finish them.');
if (!DRY) { writeFileSync(CAT, JSON.stringify(data, null, 2) + '\n'); console.log('catalogue.json updated. Re-run: pnpm db:seed'); }
else console.log('(dry run — no changes written)');
