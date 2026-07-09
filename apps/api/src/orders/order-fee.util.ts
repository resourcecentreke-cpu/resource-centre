/**
 * Concierge-order service fee — the platform's margin for buying on the
 * customer's behalf. Env-tunable:
 *   ORDER_FEE_PCT   percentage of the unit price (default 3)
 *   ORDER_FEE_MIN   floor in KES (default 200)
 *   ORDER_FEE_MAX   cap in KES (default 5000)
 */
export interface OrderFeeConfig {
  pct: number;
  min: number;
  max: number;
}

export function parseFeeConfig(env: {
  ORDER_FEE_PCT?: string;
  ORDER_FEE_MIN?: string;
  ORDER_FEE_MAX?: string;
}): OrderFeeConfig {
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    pct: num(env.ORDER_FEE_PCT, 3),
    min: num(env.ORDER_FEE_MIN, 200),
    max: num(env.ORDER_FEE_MAX, 5000),
  };
}

export function computeServiceFee(unitPrice: number, cfg: OrderFeeConfig): number {
  if (unitPrice <= 0) return 0;
  const raw = Math.round((unitPrice * cfg.pct) / 100);
  return Math.min(Math.max(raw, cfg.min), cfg.max);
}
