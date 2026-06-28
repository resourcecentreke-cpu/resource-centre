/**
 * "Tip us" / support config. Payments go to a DTB bank account via the M-Pesa
 * Paybill for Diamond Trust Bank (Pay Bill 516600, account = the bank account
 * number). Display-only with copy helpers — no STK automation, because STK push
 * would require being the registered merchant for the shortcode.
 * Override any value via apps/web/.env (NEXT_PUBLIC_* so the browser can read it).
 */
export const TIP = {
  // M-Pesa Buy Goods (Till). Empty — we collect via Paybill to the bank account.
  till: process.env.NEXT_PUBLIC_TIP_TILL || '',
  // DTB Paybill business number.
  paybill: process.env.NEXT_PUBLIC_TIP_PAYBILL || '516600',
  // Account number = the destination DTB bank account.
  paybillAccount: process.env.NEXT_PUBLIC_TIP_PAYBILL_ACCOUNT || '0281877001',
  // Bank name shown to the sender for reassurance.
  bank: process.env.NEXT_PUBLIC_TIP_BANK || 'Diamond Trust Bank (DTB)',
  // Friendly name shown on the prompt.
  name: process.env.NEXT_PUBLIC_TIP_NAME || 'Resource Centre',
  // Suggested amounts (KES) shown as chips on the tip page.
  suggested: [100, 200, 500, 1000],
};

export const tipConfigured = (): boolean => Boolean(TIP.till || TIP.paybill);
