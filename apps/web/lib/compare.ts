'use client';
const KEY = 'rc_cmp';
export function getCompare(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function toggleCompare(slug: string): string[] {
  const list = getCompare();
  const i = list.indexOf(slug);
  if (i >= 0) list.splice(i, 1);
  else { if (list.length >= 4) return list; list.push(slug); }
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('rc-compare'));
  return list;
}
export function setCompare(slugs: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, 4)));
  window.dispatchEvent(new Event('rc-compare'));
}
export function inCompare(slug: string): boolean {
  return getCompare().includes(slug);
}
