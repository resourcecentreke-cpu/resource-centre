import { Injectable, Logger } from '@nestjs/common';
import { ReviewStatus, ReviewType } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { computeTrustScore } from './trust.util';

@Injectable()
export class TrustService {
  private readonly logger = new Logger(TrustService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Recompute one seller's customer rating (from approved store reviews) + trust score. */
  async recomputeSeller(sellerId: string): Promise<number | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: { metric: true },
    });
    if (!seller || !seller.metric) return null;

    const reviews = await this.prisma.review.findMany({
      where: { sellerId, type: ReviewType.STORE, status: ReviewStatus.APPROVED },
      select: { rating: true },
    });
    const rating = reviews.length
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : seller.metric.customerRating;

    const trustScore = computeTrustScore({
      years: seller.yearsInBusiness,
      rating,
      deliveryPerformance: seller.metric.deliveryPerformance,
      returnWindowDays: seller.returnWindowDays,
      warranty: seller.warrantyTerms,
    });

    await this.prisma.sellerMetric.update({
      where: { sellerId },
      data: { customerRating: Math.round(rating * 10) / 10, trustScore },
    });
    return trustScore;
  }

  async recomputeAll(): Promise<number> {
    const sellers = await this.prisma.seller.findMany({ select: { id: true } });
    for (const s of sellers) await this.recomputeSeller(s.id);
    this.logger.log(`Recomputed trust scores for ${sellers.length} sellers`);
    return sellers.length;
  }
}
