import Link from 'next/link';
import type { CategoryDTO } from '@rc/types';

/**
 * eBay-style "Explore popular categories" — circular icon tiles, still
 * organised into three scannable clusters so 16 categories never feel like a
 * flat tag dump. Keyword-matched on the slug so new categories slot in.
 */

const GROUPS: { title: string; match: RegExp }[] = [
  { title: 'Phones & Accessories', match: /phone|tablet|accessor|audio|earbud|headphone|speaker|wearable|watch|power|charger|cable|cover/ },
  { title: 'Computing & Cameras', match: /laptop|desktop|computer|monitor|printer|storage|camera|drone|gaming|console|network|router/ },
  { title: 'Home & Appliances', match: /tv|television|fridge|refrigerator|dishwasher|washer|washing|cooker|oven|microwave|kettle|blender|vacuum|air|iron|freezer|appliance/ },
];

const ICONS: [RegExp, string][] = [
  [/smartphone|phone(?!.*cover)/, '📱'],
  [/tablet/, '📲'],
  [/laptop|computer/, '💻'],
  [/tv|television/, '📺'],
  [/fridge|refrigerator|freezer/, '🧊'],
  [/dishwasher/, '🍽️'],
  [/wash/, '🌀'],
  [/audio|speaker|headphone/, '🎧'],
  [/earbud/, '🎧'],
  [/watch|wearable/, '⌚'],
  [/camera|drone/, '📷'],
  [/power/, '🔋'],
  [/charger|cable/, '🔌'],
  [/cover|case/, '🛡️'],
  [/accessor/, '🎒'],
];
const iconFor = (slug: string) => (ICONS.find(([re]) => re.test(slug)) || [null, '🛍️'])[1];

/**
 * Only trust the DB icon when it's an actual short glyph (emoji). Some rows
 * carry slugs/words in the icon column, which would render as giant text and
 * wreck the circle layout — fall back to the keyword-matched emoji instead.
 */
const glyphFor = (c: { icon: string | null; slug: string }) => {
  const icon = (c.icon ?? '').trim();
  const isGlyph = icon.length > 0 && [...icon].length <= 2 && !/[a-zA-Z0-9]/.test(icon);
  return isGlyph ? icon : iconFor(c.slug);
};

export default function CategoryGroups({ categories }: { categories: CategoryDTO[] }) {
  const buckets: CategoryDTO[][] = GROUPS.map(() => []);
  for (const c of categories) {
    const idx = GROUPS.findIndex((g) => g.match.test(c.slug.toLowerCase()));
    buckets[idx === -1 ? 2 : idx]!.push(c);
  }

  return (
    <div className="space-y-6">
      {GROUPS.map((g, i) =>
        buckets[i]!.length === 0 ? null : (
          <div key={g.title}>
            <h3 className="mb-3 text-sm font-bold text-muted">{g.title}</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-4">
              {buckets[i]!.map((c) => (
                <Link key={c.slug} href={`/c/${c.slug}`} className="group flex w-20 flex-col items-center text-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg2 text-2xl ring-1 ring-line transition duration-fast ease-out group-hover:ring-2 group-hover:ring-text group-hover:-translate-y-0.5">
                    {glyphFor(c)}
                  </span>
                  <span className="mt-2 line-clamp-2 text-xs font-semibold leading-tight text-text">{c.name}</span>
                  <span className="text-2xs font-medium text-faint">{c.productCount}</span>
                </Link>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
