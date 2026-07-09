import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { outboundUrl } from '../common/price.util';
import { parseAffiliateConfig, decorateUrl, AffiliateConfig } from './affiliate.util';

@Injectable()
export class GoService {
  private readonly affiliate: AffiliateConfig;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.affiliate = parseAffiliateConfig(
      config.get<string>('AFFILIATE_QUERY_JSON'),
      config.get<string>('AFFILIATE_WRAPPER_JSON'),
    );
  }

  /** Resolve an offer to its affiliate-decorated outbound URL and log the click. */
  async resolve(offerId: string): Promise<string> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { seller: true, product: { select: { id: true, name: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const raw =
      offer.productUrl ??
      outboundUrl(offer.seller.searchUrlTemplate, offer.product.name) ??
      offer.seller.website;
    if (!raw) throw new NotFoundException('No outbound URL for this offer');

    // Click logging is best-effort — never block the redirect on it.
    void this.prisma.analyticsEvent
      .create({
        data: {
          type: EventType.OFFER_CLICK,
          productId: offer.product.id,
          sellerId: offer.sellerId,
        },
      })
      .catch(() => undefined);

    return decorateUrl(raw, offer.seller.slug, this.affiliate);
  }
}
