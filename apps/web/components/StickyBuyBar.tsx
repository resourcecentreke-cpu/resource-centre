'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fmtKES } from '../lib/format';

/**
 * Mobile sticky purchase bar (Apple Store-style): once the visitor scrolls
 * past the hero price block, the price + buy action ride along at the bottom
 * of the screen, always a thumb's reach away. Hidden on desktop where the
 * inline buttons are already visible.
 */
export default function StickyBuyBar({
  name,
  price,
  sellerName,
  offerId,
  goUrl,
}: {
  name: string;
  price: number;
  sellerName: string;
  offerId?: string;
  goUrl: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-md px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 transition-transform duration-slow ease-out lg:hidden ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!shown}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-muted">{name}</div>
          <div data-price className="text-base font-bold tracking-tight tnum">
            {fmtKES(price)} <span className="text-2xs font-semibold text-faint">at {sellerName}</span>
          </div>
        </div>
        {offerId ? (
          <Link
            href={`/checkout/${offerId}`}
            className="shrink-0 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform"
          >
            🛒 Order
          </Link>
        ) : (
          <a
            href={goUrl}
            target="_blank"
            rel="noopener sponsored noreferrer"
            className="shrink-0 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform"
          >
            Buy →
          </a>
        )}
      </div>
    </div>
  );
}
