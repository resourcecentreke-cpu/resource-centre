export interface BuiltMessage {
  subject: string;
  text: string;
  html: string;
}

export const fmtKES = (n: number): string => `KSh ${Math.round(n).toLocaleString('en-KE')}`;

export interface AlertMessageOpts {
  productName: string;
  current: number;
  target: number;
  url: string;
  lang?: 'en' | 'sw';
}

export function buildAlertMessage(o: AlertMessageOpts): BuiltMessage {
  const sw = o.lang === 'sw';
  const subject = sw
    ? `Bei imeshuka: ${o.productName} sasa ${fmtKES(o.current)}`
    : `Price drop: ${o.productName} is now ${fmtKES(o.current)}`;
  const text = sw
    ? `Habari njema! ${o.productName} sasa ni ${fmtKES(o.current)} (lengo lako lilikuwa ${fmtKES(o.target)}). Angalia: ${o.url}`
    : `Good news! ${o.productName} is now ${fmtKES(o.current)} (your target was ${fmtKES(o.target)}). View it: ${o.url}`;
  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:520px;margin:0 auto;color:#2B2240">
      <h2 style="color:#FF6B5C;margin:0 0 8px">${sw ? 'Bei imeshuka!' : 'Price drop!'}</h2>
      <p style="margin:0 0 4px"><strong>${o.productName}</strong></p>
      <p style="font-size:26px;font-weight:700;margin:8px 0;color:#2FD3A5">${fmtKES(o.current)}</p>
      <p style="color:#7A7088;margin:0 0 16px">${sw ? 'Lengo lako' : 'Your target'}: ${fmtKES(o.target)}</p>
      <a href="${o.url}" style="display:inline-block;background:#FF6B5C;color:#fff;padding:12px 22px;border-radius:100px;text-decoration:none;font-weight:700">${sw ? 'Angalia bei' : 'View deal'} &rarr;</a>
      <p style="color:#A99FB4;font-size:11px;margin-top:24px">Resource Centre &middot; ${sw ? 'unapokea hii kwa sababu uliweka arifa ya bei' : 'you receive this because you set a price alert'}.</p>
    </div>`;
  return { subject, text, html };
}

export interface VerifyMessageOpts {
  url: string;
  lang?: 'en' | 'sw';
}

export function buildVerificationMessage(o: VerifyMessageOpts): BuiltMessage {
  const sw = o.lang === 'sw';
  const subject = sw ? 'Thibitisha barua pepe yako · Resource Centre' : 'Verify your email · Resource Centre';
  const text = sw
    ? `Karibu Resource Centre! Thibitisha barua pepe yako: ${o.url}`
    : `Welcome to Resource Centre! Please verify your email: ${o.url}`;
  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:520px;margin:0 auto;color:#2B2240">
      <h2 style="color:#FF6B5C;margin:0 0 8px">${sw ? 'Karibu!' : 'Welcome!'}</h2>
      <p style="color:#7A7088">${sw ? 'Bonyeza ili kuthibitisha barua pepe yako na kuwasha arifa za bei.' : 'Confirm your email to activate price alerts.'}</p>
      <a href="${o.url}" style="display:inline-block;background:#FF6B5C;color:#fff;padding:12px 22px;border-radius:100px;text-decoration:none;font-weight:700">${sw ? 'Thibitisha' : 'Verify email'} &rarr;</a>
    </div>`;
  return { subject, text, html };
}
