// Phone tier + price-band definitions. Tiers group the price bands into the
// five named segments; bands are the exact KES ranges requested. Both render as
// their own pages under /phones/[seg].

export interface PhoneSegment {
  slug: string;
  label: string;
  min: number; // inclusive
  max: number | null; // inclusive; null = open-ended
  blurb: string;
}

export const PHONE_TIERS: PhoneSegment[] = [
  { slug: 'flagship', label: 'Flagship Phones', min: 76000, max: null,
    blurb: 'Top-end phones — best cameras, fastest chips and premium builds.' },
  { slug: 'upper-midrange', label: 'Upper Midrange Phones', min: 42000, max: 75999,
    blurb: 'Near-flagship features for noticeably less money.' },
  { slug: 'midrange', label: 'Midrange Phones', min: 30000, max: 41999,
    blurb: 'The sweet spot — strong all-rounders for everyday use.' },
  { slug: 'lower-midrange', label: 'Lower Midrange Phones', min: 16000, max: 29999,
    blurb: 'Dependable phones with good battery and clean screens on a budget.' },
  { slug: 'budget', label: 'Budget Phones', min: 11000, max: 15999,
    blurb: 'Affordable entry-level phones that cover the essentials.' },
];

export const PHONE_BANDS: PhoneSegment[] = [
  { slug: 'price-11000-15999', label: 'KSh 11,000 – 15,999', min: 11000, max: 15999, blurb: 'Entry-level phones under KSh 16,000.' },
  { slug: 'price-16000-22999', label: 'KSh 16,000 – 22,999', min: 16000, max: 22999, blurb: 'Affordable phones from KSh 16,000.' },
  { slug: 'price-23000-29999', label: 'KSh 23,000 – 29,999', min: 23000, max: 29999, blurb: 'Lower-midrange phones from KSh 23,000.' },
  { slug: 'price-30000-41999', label: 'KSh 30,000 – 41,999', min: 30000, max: 41999, blurb: 'Midrange phones from KSh 30,000.' },
  { slug: 'price-42000-59999', label: 'KSh 42,000 – 59,999', min: 42000, max: 59999, blurb: 'Upper-midrange phones from KSh 42,000.' },
  { slug: 'price-60000-75999', label: 'KSh 60,000 – 75,999', min: 60000, max: 75999, blurb: 'Premium phones from KSh 60,000.' },
  { slug: 'price-76000-plus', label: 'KSh 76,000 and above', min: 76000, max: null, blurb: 'Flagship phones from KSh 76,000.' },
];

export const findSegment = (slug: string): PhoneSegment | undefined =>
  [...PHONE_TIERS, ...PHONE_BANDS].find((s) => s.slug === slug);

export const allSegmentSlugs = (): string[] =>
  [...PHONE_TIERS, ...PHONE_BANDS].map((s) => s.slug);
