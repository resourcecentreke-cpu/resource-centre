/** URL slug — matches the seed's slugify so ids stay consistent (keeps "S26+" distinct). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
