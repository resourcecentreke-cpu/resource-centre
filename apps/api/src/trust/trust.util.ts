export interface TrustInput {
  years: number;
  rating: number; // 0..5
  deliveryPerformance: number; // 0..1
  returnWindowDays: number;
  warranty: string | null;
}

/** 0..100 trust score. Mirrors the seed formula so scores stay consistent. */
export function computeTrustScore(i: TrustInput): number {
  const yr = (Math.min(i.years, 12) / 12) * 22;
  const rt = (Math.max(0, Math.min(i.rating, 5)) / 5) * 34;
  const sh = Math.max(0, Math.min(i.deliveryPerformance, 1)) * 22;
  const rr = (Math.min(i.returnWindowDays, 14) / 14) * 12;
  const wr = i.warranty && i.warranty.startsWith('12') ? 10 : 6;
  return Math.round(yr + rt + sh + rr + wr);
}
