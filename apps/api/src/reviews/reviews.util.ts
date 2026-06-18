import { ReviewType } from '@rc/db';
import type { ReviewTypeWire } from '@rc/types';

/** Mask an email for public display: brian@gmail.com -> b***@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || !local) return 'Resource Centre user';
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

export function reviewTypeToWire(t: ReviewType): ReviewTypeWire {
  return t.toLowerCase() as ReviewTypeWire;
}
