import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReviewStatus, ReviewType } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { CreateReviewDto, ReviewTypeInput } from './dto/create-review.dto';
import { ModerationAction } from './dto/moderate-review.dto';
import { maskEmail, reviewTypeToWire } from './reviews.util';
import type { ReviewDTO } from '@rc/types';

type ReviewRow = {
  id: string; type: ReviewType; rating: number; title: string | null; body: string;
  isVerifiedBuyer: boolean; createdAt: Date; user: { email: string } | null;
};

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trust: TrustService,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewDTO> {
    if (dto.type === ReviewTypeInput.Product) {
      if (!dto.productSlug) throw new BadRequestException('productSlug is required for product reviews');
      const product = await this.prisma.product.findUnique({ where: { slug: dto.productSlug } });
      if (!product) throw new NotFoundException('Product not found');
      const row = await this.prisma.review.create({
        data: {
          type: ReviewType.PRODUCT, productId: product.id, userId,
          rating: dto.rating, title: dto.title ?? null, body: dto.body, status: ReviewStatus.PENDING,
        },
        include: { user: { select: { email: true } } },
      });
      return this.toDto(row);
    }
    if (!dto.sellerSlug) throw new BadRequestException('sellerSlug is required for store reviews');
    const seller = await this.prisma.seller.findUnique({ where: { slug: dto.sellerSlug } });
    if (!seller) throw new NotFoundException('Seller not found');
    const row = await this.prisma.review.create({
      data: {
        type: ReviewType.STORE, sellerId: seller.id, userId,
        rating: dto.rating, title: dto.title ?? null, body: dto.body, status: ReviewStatus.PENDING,
      },
      include: { user: { select: { email: true } } },
    });
    return this.toDto(row);
  }

  async listForProduct(slug: string): Promise<ReviewDTO[]> {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');
    const rows = await this.prisma.review.findMany({
      where: { productId: product.id, type: ReviewType.PRODUCT, status: ReviewStatus.APPROVED },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async listForSeller(slug: string): Promise<ReviewDTO[]> {
    const seller = await this.prisma.seller.findUnique({ where: { slug } });
    if (!seller) throw new NotFoundException('Seller not found');
    const rows = await this.prisma.review.findMany({
      where: { sellerId: seller.id, type: ReviewType.STORE, status: ReviewStatus.APPROVED },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async pending(): Promise<ReviewDTO[]> {
    const rows = await this.prisma.review.findMany({
      where: { status: ReviewStatus.PENDING },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async moderate(id: string, action: ModerationAction): Promise<ReviewDTO> {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Review not found');
    const status = action === ModerationAction.Approved ? ReviewStatus.APPROVED : ReviewStatus.REJECTED;
    const row = await this.prisma.review.update({
      where: { id }, data: { status },
      include: { user: { select: { email: true } } },
    });
    // Approving a store review feeds the seller's rating/trust score.
    if (status === ReviewStatus.APPROVED && existing.type === ReviewType.STORE && existing.sellerId) {
      await this.trust.recomputeSeller(existing.sellerId);
    }
    return this.toDto(row);
  }

  private toDto(r: ReviewRow): ReviewDTO {
    return {
      id: r.id,
      type: reviewTypeToWire(r.type),
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: r.user ? maskEmail(r.user.email) : 'Resource Centre user',
      isVerifiedBuyer: r.isVerifiedBuyer,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
