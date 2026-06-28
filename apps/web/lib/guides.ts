import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Buying guides are plain Markdown files in apps/web/content/guides/*.md with a
// small YAML-ish frontmatter block. Rendered with a tiny, dependency-free
// Markdown subset (content is authored/trusted, not user input).

const DIR = join(process.cwd(), 'content', 'guides');

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  category: string;
}
export interface Guide extends GuideMeta {
  html: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2">$1</a>');
}

/** Minimal Markdown → HTML for the subset used in guides. */
function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`); list = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara(); flushList();
      const lvl = m[1]!.length;
      out.push(`<h${lvl}>${inline(m[2]!)}</h${lvl}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushPara(); flushList(); out.push('<hr/>');
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
      list.items.push(m[1]!);
    } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      flushPara();
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
      list.items.push(m[1]!);
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); flushList(); out.push(`<blockquote>${inline(m[1]!)}</blockquote>`);
    } else {
      flushList(); para.push(line);
    }
  }
  flushPara(); flushList();
  return out.join('\n');
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: m[2]! };
}

function files(): string[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR).filter((f) => f.endsWith('.md'));
}

export function listGuides(): GuideMeta[] {
  return files()
    .map((f) => {
      const { meta } = parseFrontmatter(readFileSync(join(DIR, f), 'utf8'));
      return {
        slug: f.replace(/\.md$/, ''),
        title: meta.title ?? f,
        description: meta.description ?? '',
        date: meta.date ?? '',
        category: meta.category ?? '',
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function guideSlugs(): string[] {
  return files().map((f) => f.replace(/\.md$/, ''));
}

export function getGuide(slug: string): Guide | null {
  const path = join(DIR, `${slug}.md`);
  if (!existsSync(path)) return null;
  const { meta, body } = parseFrontmatter(readFileSync(path, 'utf8'));
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? '',
    date: meta.date ?? '',
    category: meta.category ?? '',
    html: mdToHtml(body),
  };
}
