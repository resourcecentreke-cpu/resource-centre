import { mpesaTimestamp, stkPassword, normalizeMsisdn, isValidMsisdn, parseStkCallback } from './mpesa.util';

describe('mpesa.util', () => {
  it('formats timestamp', () => {
    expect(mpesaTimestamp(new Date(2026, 5, 15, 9, 5, 3))).toBe('20260615090503');
  });
  it('builds a decodable STK password', () => {
    const pw = stkPassword('174379', 'passkey123', '20260615090503');
    expect(Buffer.from(pw, 'base64').toString()).toBe('174379passkey12320260615090503');
  });
  it.each([
    ['0712345678', '254712345678'],
    ['+254712345678', '254712345678'],
    ['712345678', '254712345678'],
    ['254112345678', '254112345678'],
  ])('normalizes %s -> %s', (input, expected) => {
    expect(normalizeMsisdn(input)).toBe(expected);
  });
  it('validates msisdn', () => {
    expect(isValidMsisdn('254712345678')).toBe(true);
    expect(isValidMsisdn('25471234')).toBe(false);
  });
  it('parses success and failed callbacks', () => {
    const ok = parseStkCallback({ Body: { stkCallback: { CheckoutRequestID: 'ws1', ResultCode: 0, ResultDesc: 'OK', CallbackMetadata: { Item: [{ Name: 'Amount', Value: 5000 }, { Name: 'MpesaReceiptNumber', Value: 'QABC123' }] } } } });
    expect(ok).toMatchObject({ checkoutRequestId: 'ws1', resultCode: 0, receipt: 'QABC123', amount: 5000 });
    const fail = parseStkCallback({ Body: { stkCallback: { CheckoutRequestID: 'ws2', ResultCode: 1032, ResultDesc: 'Cancelled' } } });
    expect(fail).toMatchObject({ resultCode: 1032 });
    expect(fail?.receipt).toBeUndefined();
    expect(parseStkCallback({ nope: true })).toBeNull();
  });
});
