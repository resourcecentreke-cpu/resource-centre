import { Inject, Injectable, Logger } from '@nestjs/common';
import { StockStatus } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { matchProduct, MatchProductRef } from './matching.util';
import {
  IngestProduct, RawListing, RawStock, SourceAdapter, SOURCE_ADAPTERS,
} from './adapters/source-adapter.interface';

const stockMap: Record<RawStock, StockStatus> = {
  in: StockStatus.IN,
  low: StockStatus.LOW,
  out: StockStatus.OUT,
};

export interface IngestSummary {
  adaptersRun: number;
  listings: number;
  offersUpserted: number;
  productsTouched: number;
  historyAppended: number;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SOURCE_ADAPTERS) private readonly adapters: SourceAdapter[],
  ) {}

  async run(): Promise<IngestSummary> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { offers: { include: { seller: { select: { slug: true } } } } },
    });
    const refs: MatchProductRef[] = products.map((p) => ({ id: p.id, slug: p.slug, name: p.name }));
    const ingestProducts: IngestProduct[] = products.map((p) => ({
      id: p.id, slug: p.slug, name: p.name, brand: p.brand,
      offers: p.offers.map((o) => ({
        sellerSlug: o.seller.slug, price: o.price, deliveryFee: o.deliveryFee,
        inStock: o.inStock.toLowerCase() as RawStock,
      })),
    }));

    const sellers = await this.prisma.seller.findMany({ select: { id: true, slug: true } });
    const sellerBySlug = new Map(sellers.map((s) => [s.slug, s.id]));

    const enabled = this.adapters.filter((a) => a.isEnabled());
    let listings = 0;
    let offersUpserted = 0;
    const touched = new Set<string>();

    for (const adapter of enabled) {
      let raw: RawListing[] = [];
      try {
        raw = await adapter.fetchListings(ingestProducts);
      } catch (e) {
        this.logger.warn(`Adapter "${adapter.key}" failed: ${(e as Error).message}`);
        continue;
      }
      listings += raw.length;
      for (const l of raw) {
        const productId = matchProduct({ productSlug: l.productSlug, name: l.name }, refs);
        const sellerId = sellerBySlug.get(l.sellerSlug);
        if (!productId || !sellerId || !(l.price > 0)) continue;
        await this.prisma.offer.upsert({
          where: { productId_sellerId: { productId, sellerId } },
          update: {
            price: l.price,
            ...(l.deliveryFee !== undefined ? { deliveryFee: l.deliveryFee } : {}),
            ...(l.inStock ? { inStock: stockMap[l.inStock] } : {}),
            ...(l.url ? { productUrl: l.url } : {}),
            lastSeenAt: new Date(),
          },
          create: {
            productId, sellerId, price: l.price,
            deliveryFee: l.deliveryFee ?? 0,
            inStock: l.inStock ? stockMap[l.inStock] : StockStatus.IN,
            productUrl: l.url ?? null,
          },
        });
        offersUpserted++;
        touched.add(productId);
      }
    }

    // Recompute aggregates + append history where the min price moved.
    let historyAppended = 0;
    for (const productId of touched) {
      const offers = await this.prisma.offer.findMany({
        where: { productId },
        orderBy: { price: 'asc' },
      });
      if (!offers.length) continue;
      const min = offers[0]!.price;
      const max = offers[offers.length - 1]!.price;
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      const prevMin = product?.minPrice ?? min;

      await this.prisma.product.update({
        where: { id: productId },
        data: { minPrice: min, maxPrice: max, offerCount: offers.length },
      });

      if (min !== prevMin) {
        await this.prisma.priceHistory.create({
          data: { productId, offerId: offers[0]!.id, sellerId: offers[0]!.sellerId, price: min },
        });
        historyAppended++;
      }
    }

    const summary: IngestSummary = {
      adaptersRun: enabled.length,
      listings,
      offersUpserted,
      productsTouched: touched.size,
      historyAppended,
    };
    this.logger.log(
      `Ingestion: ${summary.adaptersRun} adapters, ${summary.offersUpserted} offers, ` +
      `${summary.productsTouched} products, ${summary.historyAppended} history points`,
    );
    return summary;
  }
}
