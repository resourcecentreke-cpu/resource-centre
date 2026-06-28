'use client';
import { useState } from 'react';
import ProductImage from './ProductImage';

/**
 * Product image gallery: a large main image plus a thumbnail strip when a
 * product has more than one photo. Falls back to ProductImage (catalogue image
 * → uploaded local → brand text) when there are no gallery images.
 */
export default function ProductGallery({
  slug,
  images,
  fallback,
  brand,
  name,
}: {
  slug: string;
  images: string[];
  fallback: string | null;
  brand: string;
  name: string;
}) {
  const gallery = images && images.length ? images : fallback ? [fallback] : [];
  const [active, setActive] = useState(0);

  const frame =
    'h-80 rounded-2xl border border-[#E3E6F4] bg-gradient-to-b from-white to-[#F4F6FD] flex items-center justify-center p-6 shadow-sm';

  if (gallery.length === 0) {
    return (
      <div className={frame}>
        <ProductImage slug={slug} fallback={null} brand={brand} alt={name}
          className="max-h-[85%] max-w-[85%] object-contain drop-shadow-lg" brandClassName="text-mut" />
      </div>
    );
  }

  const src = gallery[Math.min(active, gallery.length - 1)];
  return (
    <div>
      <div className={frame}>
        <img src={src} alt={name} className="max-h-[85%] max-w-[85%] object-contain drop-shadow-lg" />
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {gallery.map((u, i) => (
            <button key={u} type="button" onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-lg border p-1 bg-white transition ${i === active ? 'border-coral' : 'border-[#E3E6F4] hover:border-coral'}`}>
              <img src={u} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
