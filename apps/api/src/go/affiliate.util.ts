/**
 * Affiliate URL decoration — turns a plain outbound store link into a
 * revenue-earning one. Config is env-driven so codes can be added per seller
 * as affiliate accounts get approved, with zero code changes:
 *
 *   AFFILIATE_QUERY_JSON   {"jumia-kenya":"aff_id=YOUR_ID","kilimall":"tag=YOUR_TAG"}
 *     → query params appended to the seller's product URL.
 *
 *   AFFILIATE_WRAPPER_JSON {"jumia-kenya":"https://track.network.com/click?pid=YOUR_PID&url={url}"}
 *     → for affiliate networks that wrap the destination URL; {url} is
 *       replaced with the (already query-decorated) encoded target.
 *
 * Sellers without an entry still get UTM referral tracking.
 */
export interface AffiliateConfig {
  /** sellerSlug → query string to append (no leading ? or &). */
  query: Record<string, string>;
  /** sellerSlug → wrapper template containing {url}. */
  wrapper: Record<string, string>;
}

function parseJsonMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter(
          ([, v]) => typeof v === 'string' && v.length > 0,
        ),
      ) as Record<string, string>;
    }
  } catch {
    /* malformed env — treat as unconfigured rather than crash */
  }
  return {};
}

export function parseAffiliateConfig(
  queryJson?: string,
  wrapperJson?: string,
): AffiliateConfig {
  return { query: parseJsonMap(queryJson), wrapper: parseJsonMap(wrapperJson) };
}

/** Append a raw query string ("a=1&b=2") to a URL that may already have one. */
function appendQuery(url: string, qs: string): string {
  if (!qs) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${qs}`;
}

/**
 * Decorate an outbound URL with UTM referral params, the seller's affiliate
 * query params (if configured), and finally the network wrapper (if any).
 */
export function decorateUrl(url: string, sellerSlug: string, cfg: AffiliateConfig): string {
  let out = url;
  if (!/[?&]utm_source=/.test(out)) {
    out = appendQuery(out, 'utm_source=resourcecentre&utm_medium=referral');
  }
  const extra = cfg.query[sellerSlug];
  if (extra) out = appendQuery(out, extra);
  const wrapper = cfg.wrapper[sellerSlug];
  if (wrapper && wrapper.includes('{url}')) {
    out = wrapper.replace('{url}', encodeURIComponent(out));
  }
  return out;
}
