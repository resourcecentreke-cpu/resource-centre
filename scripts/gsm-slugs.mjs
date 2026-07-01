#!/usr/bin/env node
/**
 * Find the correct GSM Arena image slug for every Phone / Tablet / Smart Watch
 * that lacks one, by querying GSM Arena's search and matching result names.
 * Writes the slug into packages/db/data/catalogue.json (`img` field) so the
 * site shows GSM Arena's official device renders — same mechanism as the rest
 * of the catalogue.
 *
 * Run on YOUR machine (needs internet; Node 18+). GSM Arena rate-limits, so
 * this is slow on purpose (~3s per device):
 *     node scripts/gsm-slugs.mjs --dry        # show matches only
 *     node scripts/gsm-slugs.mjs              # write catalogue.json
 *     node scripts/gsm-slugs.mjs --limit=10
 *
 * Afterwards run  node scripts/fix-phone-images.mjs  to double-check, then
 * deploy (the server seed picks up the new slugs).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAT = join(ROOT, 'packages', 'db', 'data', 'catalogue.json');
const CATS = new Set(['Phones', 'Tablets', 'Smart Watches']);
const DRY = process.argv.includes('--dry');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const items = JSON.parse(readFileSync(CAT, 'utf8'));
let targets = items.filter((it) => CATS.has(it.cat) && !it.img);
if (LIMIT) targets = targets.slice(0, LIMIT);
console.log(`${targets.length} device(s) missing a GSM Arena slug\n`);

const norm = (s) =>
  s.toLowerCase()
    .replace(/\(([^)]+)\)/g, ' $1 ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const STOP = new Set(['5g', '4g', 'lte', 'dual', 'sim', 'new', 'the']);
const tokens = (s) => norm(s).split(' ').filter((t) => t && !STOP.has(t));

function score(want, cand) {
  const w = tokens(want);
  const c = new Set(tokens(cand));
  if (!w.length) return 0;
  let hit = 0;
  for (const t of w) {
    if (c.has(t)) hit++;
    else if ([...c].some((x) => x.includes(t) && t.length >= 2)) hit += 0.5;
  }
  // model numbers must agree ("s26" vs "s25" is a different phone)
  for (const t of w.filter((x) => /\d/.test(x))) {
    if (!c.has(t) && ![...c].some((x) => x.includes(t))) return 0;
  }
  return hit / w.length;
}

async function search(q) {
  const url = `https://www.gsmarena.com/res.php3?sSearch=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (res.status === 429) throw new Error('rate-limited — wait a few minutes and re-run');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // result entries: <img src="https://fdn2.gsmarena.com/vv/bigpic/<slug>.jpg" ...><strong><span>Name</span>
  const out = [];
  const re = /bigpic\/([a-z0-9_-]+)\.jpg[^>]*>[\s\S]{0,200}?<(?:strong|span)>([\s\S]*?)<\/(?:strong|span)>/gi;
  let m;
  while ((m = re.exec(html))) out.push({ slug: m[1], name: m[2].replace(/<[^>]+>/g, ' ').trim() });
  return out;
}

const report = [['name', 'status', 'slug', 'matched']];
let ok = 0, miss = 0, fail = 0;

for (const it of targets) {
  // Search with brand + model, dropping bracketed qualifiers first.
  const q = tokens(it.name).slice(0, 5).join(' ');
  try {
    const results = await search(q);
    const ranked = results
      .map((r) => ({ ...r, s: score(it.name, r.name) }))
      .sort((a, b) => b.s - a.s);
    const best = ranked[0];
    if (best && best.s >= 0.6) {
      console.log(`✅ ${it.name}  →  ${best.slug}  ("${best.name}")`);
      if (!DRY) it.img = best.slug;
      report.push([it.name, DRY ? 'dry-match' : 'ok', best.slug, best.name]);
      ok++;
    } else {
      console.log(`⚠️  ${it.name}  no confident match (best: "${best?.name || '—'}")`);
      report.push([it.name, 'no-match', '', best?.name || '']);
      miss++;
    }
  } catch (e) {
    console.log(`❌ ${it.name}  ${e.message}`);
    report.push([it.name, 'fail', '', e.message]);
    fail++;
    if (/rate-limited/.test(e.message)) break;
  }
  await new Promise((r) => setTimeout(r, 3000)); // GSM Arena is strict — be gentle
}

if (!DRY && ok) writeFileSync(CAT, JSON.stringify(items, null, 2));
writeFileSync(
  join(ROOT, 'gsm-slugs-report.csv'),
  report.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'),
);
console.log(`\nDone: ${ok} matched · ${miss} no-match · ${fail} failed${!DRY && ok ? ' — catalogue.json updated' : ''}`);
if (!DRY && ok) console.log('Now run: node scripts/fix-phone-images.mjs   (verifies the new slugs)');
