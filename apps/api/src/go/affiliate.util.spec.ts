import { parseAffiliateConfig, decorateUrl } from './affiliate.util';

describe('parseAffiliateConfig', () => {
  it('parses valid JSON maps', () => {
    const cfg = parseAffiliateConfig('{"jumia-kenya":"aff_id=123"}', '{"kilimall":"https://t.co/?u={url}"}');
    expect(cfg.query['jumia-kenya']).toBe('aff_id=123');
    expect(cfg.wrapper['kilimall']).toBe('https://t.co/?u={url}');
  });

  it('treats missing or malformed env as empty config', () => {
    expect(parseAffiliateConfig(undefined, undefined)).toEqual({ query: {}, wrapper: {} });
    expect(parseAffiliateConfig('not-json', '[1,2]')).toEqual({ query: {}, wrapper: {} });
  });

  it('drops non-string values', () => {
    const cfg = parseAffiliateConfig('{"a":"x","b":1,"c":""}');
    expect(cfg.query).toEqual({ a: 'x' });
  });
});

describe('decorateUrl', () => {
  const cfg = parseAffiliateConfig(
    '{"jumia-kenya":"aff_id=PLACEHOLDER"}',
    '{"kilimall":"https://track.net/click?pid=P&url={url}"}',
  );

  it('always appends UTM referral params', () => {
    expect(decorateUrl('https://shop.co.ke/x', 'unknown-seller', cfg)).toBe(
      'https://shop.co.ke/x?utm_source=resourcecentre&utm_medium=referral',
    );
  });

  it('does not duplicate UTM params already present', () => {
    const url = 'https://shop.co.ke/x?utm_source=resourcecentre&utm_medium=referral';
    expect(decorateUrl(url, 'unknown-seller', cfg)).toBe(url);
  });

  it('appends the seller affiliate query params', () => {
    expect(decorateUrl('https://jumia.co.ke/p', 'jumia-kenya', cfg)).toBe(
      'https://jumia.co.ke/p?utm_source=resourcecentre&utm_medium=referral&aff_id=PLACEHOLDER',
    );
  });

  it('wraps with the network template, URL-encoding the target', () => {
    const out = decorateUrl('https://kilimall.co.ke/p?a=1', 'kilimall', cfg);
    expect(out.startsWith('https://track.net/click?pid=P&url=')).toBe(true);
    expect(decodeURIComponent(out.split('url=')[1] ?? '')).toBe(
      'https://kilimall.co.ke/p?a=1&utm_source=resourcecentre&utm_medium=referral',
    );
  });
});
