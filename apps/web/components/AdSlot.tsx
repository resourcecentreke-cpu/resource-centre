'use client';
import { useEffect } from 'react';
import { ADSENSE_CLIENT } from '../lib/seo';

/**
 * A single AdSense display unit. Auto-ads already run from the loader in the
 * <head>; use this for explicit in-content placements. Renders nothing unless a
 * slot id is provided (via prop or NEXT_PUBLIC_ADSENSE_SLOT) so we never show an
 * empty ad box before real units exist in your AdSense account.
 */
export default function AdSlot({
  slot,
  format = 'auto',
  className = '',
  style,
}: {
  slot?: string;
  format?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const slotId = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT || '';

  useEffect(() => {
    if (!slotId) return;
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense loader script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* loader not ready / blocked — ignore */
    }
  }, [slotId]);

  if (!slotId) return null;

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
