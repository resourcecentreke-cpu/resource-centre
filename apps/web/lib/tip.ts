/**
 * "Tip us" / support config. Display-only M-Pesa details — no STK automation.
 * Set these in apps/web/.env (NEXT_PUBLIC_* so they are available at build/runtime).
 * The placeholders below are clearly marked so an unconfigured deploy is obvious.
 */
export const TIP = {
  // Buy Goods (Till) number, e.g. "5167...". Leave empty to hide the Till card.
  till: process.env.NEXT_PUBLIC_TIP_TILL || '',
  // Paybill business number + account, used if you collect via Paybill instead.
  paybill: process.env.NEXT_PUBLIC_TIP_PAYBILL || '',
  paybillAccount: process.env.NEXT_PUBLIC_TIP_PAYBILL_ACCOUNT || 'TIP',
  // Friendly name shown on the confirmation prompt.
  name: process.env.NEXT_PUBLIC_TIP_NAME || 'Resource Centre',
  // Suggested amounts (KES) shown as chips on the tip page.
  suggested: [50, 100, 200, 500],
};

export const tipConfigured = (): boolean => Boolean(TIP.till || TIP.paybill);
