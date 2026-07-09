import { Injectable } from '@nestjs/common';
import { SponsoredPlacement } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import type { SponsoredListingDTO, ProductSummaryDTO } from '@rc/types';

const PLACEMENT_MAP: Record<string, SponsoredPlacement> = {
  home: SponsoredPlacement.HOME_HERO,
  category: SponsoredPlacement.CATEGORY_TOP,
  product: SponsoredPlacement.PRODUCT_RELATED,
};

const firstImage = (images: unknown): string | null =>
  Array.isArray(images) && typeof images[0] === 'string' ? images[0] : null;

@Injectable()
export class SponsoredService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active, paid, in-window sponsored listings for a public placement. */
  async active(placement: string, limit = 6): Promise<SponsoredListingDTO[]> {
    const p = PLACEMENT_MAP[placement] ?? SponsoredPlacement.HOME_HERO;
    const now = new Date();
    const rows = await this.prisma.sponsoredListing.findMany({
      where: { placement: p, isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      include: { seller: true, product: { include: { category: true } } },
      orderBy: { endsAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      sellerName: r.seller.name,
      sellerSlug: r.seller.slug,
      sellerWebsite: r.seller.website ?? null,
      placement,
      endsAt: r.endsAt.toISOString(),
      product: r.product
        ? {
            id: r.product.id,
            slug: r.product.slug,
            name: r.product.name,
            brand: r.product.brand,
            category: r.product.category.name,
            categorySlug: r.product.category.slug,
            specSummary: r.product.specSummary,
            image: firstImage(r.product.images),
            minPrice: r.product.minPrice,
            isNew: r.product.isNew,
            releaseDate: r.product.releaseDate ? r.product.releaseDate.toISOString() : null,
            specs: (r.product.specs ?? null) as ProductSummaryDTO['specs'],
          }
        : null,
    }));
  }
}
