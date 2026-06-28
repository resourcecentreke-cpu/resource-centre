'use client';
import { useState } from 'react';

/**
 * Product image with a manual-photo override and graceful fallback.
 *
 * Resolution order:
 *   1. The catalogue image (GSM Arena / API), if present and it loads.
 *   2. A locally uploaded photo at /products/<slug>.jpg  ← drop a file here to add a real photo.
 *   3. The brand name as a text placeholder.
 *
 * So to add a real photo for a product, just upload a JPG named after its slug
 * (the bit after /p/ in the URL) into apps/web/public/products/ — no rebuild or
 * re-seed needed, public files are served immediately.
 */
export default function ProductImage({
  slug,
  fallback,
  brand,
  alt,
  className = '',
  brandClassName = 'text-mut text-xs',
}: {
  slug: string;
  fallback: string | null;
  brand: string;
  alt: string;
  className?: string;
  brandClassName?: string;
}) {
  const local = `/products/${slug}.jpg`;
  const [src, setSrc] = useState<string>(fallback || local);
  const [triedLocal, setTriedLocal] = useState<boolean>(!fallback); // if no fallback we start on local
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!triedLocal) {
      // catalogue image failed (missing/broken) → try a manually uploaded photo
      setTriedLocal(true);
      setSrc(local);
    } else {
      setFailed(true);
    }
  };

  if (failed) return <div className={brandClassName}>{brand}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={handleError} />;
}
