import Link from 'next/link';
import type { CategoryDTO } from '@rc/types';

/**
 * Categories grouped into three scannable clusters instead of one flat
 * 16-tag row: Phones & Accessories / Computing & Cameras / Home & Appliances.
 * Matching is keyword-based on the slug so new categories slot in automatically.
 */

const GROUPS: { title: string; icon: string; match: RegExp }[] = [
  {
    title: 'Phones & Accessories',
    icon: '📱',
    match: /phone|tablet|accessor|audio|earbud|headphone|speaker|wearable|watch|power/,
  },
  {
    title: 'Computing & Cameras',
    icon: '💻',
    match: /laptop|desktop|computer|monitor|printer|storage|camera|drone|gaming|console|network|router/,
  },
  {
    title: 'Home & Appliances',
    icon: '🏠',
    match: /tv|television|fridge|refrigerator|dishwasher|washer|washing|cooker|oven|microwave|kettle|blender|vacuum|air|iron|freezer|appliance/,
  },
];

export default function CategoryGroups({ categories }: { categories: CategoryDTO[] }) {
  const buckets: CategoryDTO[][] = GROUPS.map(() => []);
  for (const c of categories) {
    const idx = GROUPS.findIndex((g) => g.match.test(c.slug.toLowerCase()));
    buckets[idx === -1 ? 2 : idx]!.push(c); // unmatched → Home & Appliances
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {GROUPS.map((g, i) =>
        buckets[i]!.length === 0 ? null : (
          <div key={g.title} className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>{g.icon}</span>
              <h3 className="text-sm font-bold text-text">{g.title}</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {buckets[i]!.map((c) => (
                <Link
                  key={c.slug}
                  href={`/c/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-bg2 px-3 py-1.5 text-xs font-semibold text-text ring-1 ring-line transition duration-fast ease-out hover:ring-line-strong hover:-translate-y-0.5"
                >
                  {c.name}
                  <span className="font-medium text-faint">{c.productCount}</span>
                </Link>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
