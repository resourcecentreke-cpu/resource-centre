import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';
import { priceStats, outboundUrl } from '../common/price.util';
import type {
  Paginated, ProductSummaryDTO, ProductDetailDTO, OfferDTO, DeliveryDTO, PriceHistoryPoint, DealDTO,
  TopInterestDTO,
} from '@rc/types';

const firstImage = (images: unknown): string | null =>
  Array.isArray(images) && images.length ? String(images[0]) : null;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductQueryDto): Promise<Paginated<ProductSummaryDTO>> {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (query.category) where.category = { slug: query.category };
    if (query.brand) where.brand = query.brand;
    if (query.isNew !== undefined) where.isNew = query.isNew;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.minPrice = {};
      if (query.minPrice !== undefined) where.minPrice.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.minPrice.lte = query.maxPrice;
    }
    if (query.inStock) where.offers = { some: { inStock: { not: 'OUT' } } };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { brand: { contains: query.q, mode: 'insensitive' } },
        { specSummary: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === ProductSort.PriceDesc ? { minPrice: 'desc' }
      : query.sort === ProductSort.Newest ? { createdAt: 'desc' }
      : query.sort === ProductSort.Name ? { name: 'asc' }
      : { minPrice: 'asc' };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { category: true },
      }),
    ]);

    return {
      items: rows.map((p) => this.toSummary(p)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async detail(slug: string): Promise<ProductDetailDTO> {
    const p = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        offers: { include: { seller: { include: { metric: true } } }, orderBy: { price: 'asc' } },
        priceHistory: { orderBy: { recordedAt: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException(`Product "${slug}" not found`);

    const offers: OfferDTO[] = p.offers.map((o) => ({
      sellerId: o.sellerId,
      sellerName: o.seller.name,
      price: o.price,
      deliveryFee: o.deliveryFee,
      inStock: o.inStock.toLowerCase() as OfferDTO['inStock'],
      rating: o.rating,
      trustScore: o.seller.metric?.trustScore ?? 0,
      productUrl: o.productUrl ?? outboundUrl(o.seller.searchUrlTemplate, p.name) ?? '#',
      lastSeenAt: o.lastSeenAt.toISOString(),
    }));

    const history: PriceHistoryPoint[] = p.priceHistory.map((h) => ({
      price: h.price,
      recordedAt: h.recordedAt.toISOString(),
    }));

    const sellerIds = [...new Set(p.offers.map((o) => o.sellerId))];
    const delivery: DeliveryDTO[] = (
      await this.prisma.deliveryEstimate.findMany({
        where: { sellerId: { in: sellerIds } },
        include: { seller: true },
      })
    ).map((d) => ({ sellerName: d.seller.name, city: d.city, days: d.days, fee: d.fee }));

    const similarRows = await this.prisma.product.findMany({
      where: { categoryId: p.categoryId, id: { not: p.id }, isActive: true },
      include: { category: true },
      take: 12,
    });
    const similar = similarRows
      .sort((a, b) => Math.abs(a.minPrice - p.minPrice) - Math.abs(b.minPrice - p.minPrice))
      .slice(0, 4)
      .map((s) => this.toSummary(s));

    return {
      ...this.toSummary(p),
      maxPrice: p.maxPrice,
      offerCount: p.offerCount,
      images: Array.isArray(p.images) ? (p.images as string[]) : [],
      bestSeller: offers[0]?.sellerName ?? null,
      offers,
      priceStats: priceStats(p.minPrice, history.map((h) => h.price)),
      history,
      delivery,
      similar,
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  /**
   * "Top N by interest" — GSM-Arena-style daily-interest ranking. Blends each
   * product's baseline `interestSeed` with its live PRODUCT_VIEW count so the
   * list works on day one and then reflects real traffic over time.
   */
  async topByInterest(categorySlug?: string, limit = 10): Promise<TopInterestDTO[]> {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (categorySlug) where.category = { slug: categorySlug };

    // Pull a bounded candidate set ordered by baseline interest, then re-rank
    // with live view counts layered on top.
    const candidates = await this.prisma.product.findMany({
      where,
      orderBy: { interestSeed: 'desc' },
      take: Math.max(limit * 6, 60),
      include: { category: true },
    });
    if (candidates.length === 0) return [];

    const viewGroups = await this.prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { type: 'PRODUCT_VIEW', productId: { in: candidates.map((c) => c.id) } },
      _count: { productId: true },
    });
    const views = new Map(viewGroups.map((g) => [g.productId as string, g._count.productId]));

    return candidates
      .map((p) => ({ p, score: p.interestSeed + (views.get(p.id) ?? 0) * 5 }))
      .sort((a, b) => b.score - a.score || b.p.minPrice - a.p.minPrice)
      .slice(0, limit)
      .map<TopInterestDTO>(({ p, score }, i) => ({
        ...this.toSummary(p),
        rank: i + 1,
        interest: score,
      }));
  }

  /**
   * Biggest price drops: products whose current min price is below their recent
   * high in price history. Powers the Deals page (repeat traffic + shareable).
   */
  async deals(limit = 24): Promise<DealDTO[]> {
    const rows = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        priceHistory: { orderBy: { recordedAt: 'desc' }, take: 30 },
        offers: { orderBy: { price: 'asc' }, take: 1, include: { seller: true } },
      },
      take: 500, // bound the scan; compute the actual drop in JS
    });

    const deals = rows
      .map((p) => {
        const prices = p.priceHistory.map((h) => h.price);
        const recentHigh = prices.length ? Math.max(...prices, p.minPrice) : p.minPrice;
        const current = p.minPrice;
        const dropAmount = recentHigh - current;
        const dropPct = recentHigh > 0 ? Math.round((dropAmount / recentHigh) * 100) : 0;
        return { p, current, previousPrice: recentHigh, dropAmount, dropPct };
      })
      .filter((d) => d.dropPct >= 1 && d.dropAmount > 0)
      .sort((a, b) => b.dropPct - a.dropPct)
      .slice(0, limit)
      .map<DealDTO>(({ p, current, previousPrice, dropAmount, dropPct }) => ({
        ...this.toSummary(p),
        currentPrice: current,
        previousPrice,
        dropAmount,
        dropPct,
        bestSeller: p.offers[0]?.seller.name ?? null,
      }));

    return deals;
  }

  private toSummary(p: {
    id: string; slug: string; name: string; brand: string; specSummary: string;
    images: unknown; minPrice: number; isNew: boolean; category: { name: string; slug: string };
  }): ProductSummaryDTO {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category.name,
      categorySlug: p.category.slug,
      specSummary: p.specSummary,
      image: firstImage(p.images),
      minPrice: p.minPrice,
      isNew: p.isNew,
    };
  }
}
