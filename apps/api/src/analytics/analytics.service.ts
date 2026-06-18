import { Injectable } from '@nestjs/common';
import { EventType } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { RecordEventDto, EventTypeInput } from './dto/record-event.dto';
import { shapeSummary } from './analytics.util';
import type { AnalyticsSummaryDTO } from '@rc/types';

const TYPE_MAP: Record<EventTypeInput, EventType> = {
  search: EventType.SEARCH,
  product_view: EventType.PRODUCT_VIEW,
  offer_click: EventType.OFFER_CLICK,
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(dto: RecordEventDto): Promise<{ recorded: true }> {
    const [product, seller] = await Promise.all([
      dto.productSlug ? this.prisma.product.findUnique({ where: { slug: dto.productSlug }, select: { id: true } }) : null,
      dto.sellerSlug ? this.prisma.seller.findUnique({ where: { slug: dto.sellerSlug }, select: { id: true } }) : null,
    ]);
    await this.prisma.analyticsEvent.create({
      data: {
        type: TYPE_MAP[dto.type],
        query: dto.query?.slice(0, 120) ?? null,
        productId: product?.id ?? null,
        sellerId: seller?.id ?? null,
      },
    });
    return { recorded: true };
  }

  async summary(): Promise<AnalyticsSummaryDTO> {
    const [searches, views, clicks] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { type: EventType.SEARCH } }),
      this.prisma.analyticsEvent.count({ where: { type: EventType.PRODUCT_VIEW } }),
      this.prisma.analyticsEvent.count({ where: { type: EventType.OFFER_CLICK } }),
    ]);

    const searchGroups = await this.prisma.analyticsEvent.groupBy({
      by: ['query'], where: { type: EventType.SEARCH, query: { not: null } },
      _count: { query: true }, orderBy: { _count: { query: 'desc' } }, take: 10,
    });
    const storeGroups = await this.prisma.analyticsEvent.groupBy({
      by: ['sellerId'], where: { type: EventType.OFFER_CLICK, sellerId: { not: null } },
      _count: { sellerId: true }, orderBy: { _count: { sellerId: 'desc' } }, take: 10,
    });
    const viewGroups = await this.prisma.analyticsEvent.groupBy({
      by: ['productId'], where: { type: EventType.PRODUCT_VIEW, productId: { not: null } },
      _count: { productId: true }, orderBy: { _count: { productId: 'desc' } }, take: 10,
    });

    const sellerIds = storeGroups.map((g) => g.sellerId).filter(Boolean) as string[];
    const productIds = viewGroups.map((g) => g.productId).filter(Boolean) as string[];
    const [sellers, products] = await Promise.all([
      this.prisma.seller.findMany({ where: { id: { in: sellerIds } }, select: { id: true, name: true } }),
      this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } }),
    ]);

    return shapeSummary({
      totals: { searches, views, clicks },
      searchGroups: searchGroups.map((g) => ({ query: g.query, count: g._count.query })),
      storeGroups: storeGroups.map((g) => ({ sellerId: g.sellerId, count: g._count.sellerId })),
      viewGroups: viewGroups.map((g) => ({ productId: g.productId, count: g._count.productId })),
      sellerNames: new Map(sellers.map((s) => [s.id, s.name])),
      productNames: new Map(products.map((p) => [p.id, { name: p.name, slug: p.slug }])),
    });
  }
}
