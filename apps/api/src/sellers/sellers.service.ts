import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewStatus, ReviewType } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import type { SellerProfileDTO } from '@rc/types';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<SellerProfileDTO[]> {
    const sellers = await this.prisma.seller.findMany({
      where: { status: 'ACTIVE' },
      include: { metric: true },
      orderBy: { name: 'asc' },
    });
    return sellers.map((s) => this.toDto(s, 0));
  }

  async bySlug(slug: string): Promise<SellerProfileDTO> {
    const seller = await this.prisma.seller.findUnique({ where: { slug }, include: { metric: true } });
    if (!seller) throw new NotFoundException('Seller not found');
    const reviewCount = await this.prisma.review.count({
      where: { sellerId: seller.id, type: ReviewType.STORE, status: ReviewStatus.APPROVED },
    });
    return this.toDto(seller, reviewCount);
  }

  private toDto(
    s: {
      name: string; slug: string; website: string | null; isVerified: boolean;
      yearsInBusiness: number; returnWindowDays: number; warrantyTerms: string | null;
      metric: { trustScore: number; customerRating: number } | null;
    },
    reviewCount: number,
  ): SellerProfileDTO {
    return {
      name: s.name,
      slug: s.slug,
      website: s.website,
      isVerified: s.isVerified,
      yearsInBusiness: s.yearsInBusiness,
      returnWindowDays: s.returnWindowDays,
      warranty: s.warrantyTerms,
      trustScore: s.metric?.trustScore ?? 0,
      customerRating: s.metric?.customerRating ?? 0,
      reviewCount,
    };
  }
}
