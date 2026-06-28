// Device-age helpers — turn a release date into a human "age" label
// ("2 months old", "1 year old", "Coming soon"), GSM-Arena style.

export interface DeviceAge {
  /** Whole months since release (negative if the device is still upcoming). */
  months: number;
  /** Short badge label, e.g. "2 mo", "1 yr", "Soon". */
  short: string;
  /** Full label, e.g. "2 months old", "1 year 3 months old", "Coming Aug 2026". */
  label: string;
  /** Released within the last ~3 months. */
  isFresh: boolean;
  /** Release date is in the future. */
  isUpcoming: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthsBetween(from: Date, to: Date): number {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

/** Compute a device's age from its release date (ISO string). Returns null if unknown. */
export function deviceAge(releaseDate?: string | null, now: Date = new Date()): DeviceAge | null {
  if (!releaseDate) return null;
  const d = new Date(releaseDate);
  if (Number.isNaN(d.getTime())) return null;

  const months = monthsBetween(d, now);

  if (months < 0) {
    const when = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    return { months, short: 'Soon', label: `Coming ${when}`, isFresh: false, isUpcoming: true };
  }

  const years = Math.floor(months / 12);
  const rem = months % 12;

  let label: string;
  let short: string;
  if (months <= 0) {
    label = 'Released this month';
    short = 'New';
  } else if (months < 12) {
    label = `${months} month${months === 1 ? '' : 's'} old`;
    short = `${months} mo`;
  } else if (rem === 0) {
    label = `${years} year${years === 1 ? '' : 's'} old`;
    short = `${years} yr`;
  } else {
    label = `${years} year${years === 1 ? '' : 's'} ${rem} month${rem === 1 ? '' : 's'} old`;
    short = `${years}y ${rem}m`;
  }

  return { months, short, label, isFresh: months <= 3, isUpcoming: false };
}

/** "Released Sep 2025" style string, or null. */
export function releasedLabel(releaseDate?: string | null): string | null {
  if (!releaseDate) return null;
  const d = new Date(releaseDate);
  if (Number.isNaN(d.getTime())) return null;
  return `Released ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
