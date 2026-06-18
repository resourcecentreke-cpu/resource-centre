/** M-Pesa Daraja helpers — all pure and unit-tested. */

/** Daraja timestamp: YYYYMMDDHHmmss (local time). */
export function mpesaTimestamp(d: Date = new Date()): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

/** STK password: base64(Shortcode + Passkey + Timestamp). */
export function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

/** Normalize any Kenyan number to 2547######## / 2541########. */
export function normalizeMsisdn(input: string): string {
  let d = (input || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '254' + d.slice(1);
  else if (d.startsWith('254')) {
    /* already E.164 without + */
  } else if (/^(7|1)\d{8}$/.test(d)) d = '254' + d;
  return d;
}

export function isValidMsisdn(msisdn: string): boolean {
  return /^254(7|1)\d{8}$/.test(msisdn);
}

export interface ParsedCallback {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  receipt?: string;
  amount?: number;
  phone?: string;
}

/** Parse a Daraja STK callback body into a flat result. */
export function parseStkCallback(body: unknown): ParsedCallback | null {
  const stk = (body as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback;
  if (!stk) return null;
  const items =
    (stk.CallbackMetadata as { Item?: { Name: string; Value: unknown }[] } | undefined)?.Item ?? [];
  const get = (name: string): unknown => items.find((i) => i.Name === name)?.Value;
  return {
    checkoutRequestId: String(stk.CheckoutRequestID ?? ''),
    resultCode: Number(stk.ResultCode ?? -1),
    resultDesc: String(stk.ResultDesc ?? ''),
    receipt: get('MpesaReceiptNumber') ? String(get('MpesaReceiptNumber')) : undefined,
    amount: get('Amount') !== undefined ? Number(get('Amount')) : undefined,
    phone: get('PhoneNumber') ? String(get('PhoneNumber')) : undefined,
  };
}
