import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SellerStatus, SponsoredPlacement, StockStatus } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slug.util';
import { CreateProductDto, UpdateProductDto } from './dto/product-admin.dto';
import { UpdateSellerDto, SellerStatusInput } from './dto/seller-admin.dto';
import { CreateSponsoredDto, UpdateSponsoredDto, SponsoredPlacementInput } from './dto/sponsored-admin.dto';
import { UpsertOfferDto, StockInput } from './dto/offer-admin.dto';

const SELLER_STATUS: Record<SellerStatusInput, SellerStatus> = {
  pending: SellerStatus.PENDING, active: SellerStatus.ACTIVE, suspended: SellerStatus.SUSPENDED,
};
const STOCK: Record<StockInput, StockStatus> = {
  in: StockStatus.IN, low: StockStatus.LOW, out: StockStatus.OUT,
};
const PLACEMENT: Record<SponsoredPlacementInput, SponsoredPlacement> = {
  home_hero: SponsoredPlacement.HOME_HERO,
  category_top: SponsoredPlacement.CATEGORY_TOP,
  product_related: SponsoredPlacement.PRODUCT_RELATED,
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ----- Products -----
  private async categoryId(slug: string): Promise<string> {
    const c = await this.prisma.category.findUnique({ where: { slug } });
    if (!c) throw new BadRequestException(`Unknown category "${slug}"`);
    return c.id;
  }

  async createProduct(dto: CreateProductDto) {
    const slug = slugify(dto.name);
    const exists = await this.prisma.product.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('A product with this name already exists');
    return this.prisma.product.create({
      data: {
        slug, name: dto.name, brand: dto.brand, categoryId: await this.categoryId(dto.categorySlug),
        specSummary: dto.specSummary, imageSlug: dto.imageSlug ?? null,
        images: dto.images ?? [], isNew: dto.isNew ?? false,
      },
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.brand ? { brand: dto.brand } : {}),
        ...(dto.categorySlug ? { categoryId: await this.categoryId(dto.categorySlug) } : {}),
        ...(dto.specSummary ? { specSummary: dto.specSummary } : {}),
        ...(dto.imageSlug !== undefined ? { imageSlug: dto.imageSlug } : {}),
        ...(dto.images ? { images: dto.images } : {}),
        ...(dto.isNew !== undefined ? { isNew: dto.isNew } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.minPrice !== undefined ? { minPrice: dto.minPrice } : {}),
      },
    });
  }

  async listProducts(q?: string) {
    return this.prisma.product.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      include: { category: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  // ----- Offers (per-product store prices) -----
  async listOffers(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.offer.findMany({
      where: { productId },
      include: { seller: { select: { name: true, slug: true } } },
      orderBy: { price: 'asc' },
    });
  }

  async upsertOffer(productId: string, dto: UpsertOfferDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    const seller = await this.prisma.seller.findUnique({ where: { id: dto.sellerId } });
    if (!seller) throw new BadRequestException('Unknown seller');
    const offer = await this.prisma.offer.upsert({
      where: { productId_sellerId: { productId, sellerId: dto.sellerId } },
      update: {
        price: dto.price,
        deliveryFee: dto.deliveryFee ?? 0,
        ...(dto.inStock ? { inStock: STOCK[dto.inStock] } : {}),
        productUrl: dto.productUrl ?? null,
        lastSeenAt: new Date(),
      },
      create: {
        productId, sellerId: dto.sellerId, price: dto.price,
        deliveryFee: dto.deliveryFee ?? 0,
        inStock: dto.inStock ? STOCK[dto.inStock] : StockStatus.IN,
        productUrl: dto.productUrl ?? null,
      },
    });
    await this.recompute(productId);
    return offer;
  }

  async deleteOffer(offerId: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offer not found');
    await this.prisma.offer.delete({ where: { id: offerId } });
    await this.recompute(offer.productId);
    return { success: true };
  }

  /** Recompute a product's min/max/offerCount; append a history point when min moves. */
  private async recompute(productId: string): Promise<void> {
    const offers = await this.prisma.offer.findMany({ where: { productId }, orderBy: { price: 'asc' } });
    if (!offers.length) {
      await this.prisma.product.update({ where: { id: productId }, data: { minPrice: 0, maxPrice: 0, offerCount: 0 } });
      return;
    }
    const min = offers[0]!.price;
    const max = offers[offers.length - 1]!.price;
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    await this.prisma.product.update({ where: { id: productId }, data: { minPrice: min, maxPrice: max, offerCount: offers.length } });
    if (product && product.minPrice !== min) {
      await this.prisma.priceHistory.create({ data: { productId, offerId: offers[0]!.id, sellerId: offers[0]!.sellerId, price: min } });
    }
  }

  // ----- Sellers -----
  async listSellers() {
    return this.prisma.seller.findMany({ include: { metric: true }, orderBy: { name: 'asc' } });
  }

  async updateSeller(id: string, dto: UpdateSellerDto) {
    const seller = await this.prisma.seller.findUnique({ where: { id } });
    if (!seller) throw new NotFoundException('Seller not found');
    return this.prisma.seller.update({
      where: { id },
      data: {
        ...(dto.status ? { status: SELLER_STATUS[dto.status] } : {}),
        ...(dto.isVerified !== undefined ? { isVerified: dto.isVerified } : {}),
      },
    });
  }

  // ----- Sponsored -----
  async listSponsored() {
    return this.prisma.sponsoredListing.findMany({
      include: { seller: { select: { name: true } }, product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSponsored(dto: CreateSponsoredDto) {
    return this.prisma.sponsoredListing.create({
      data: {
        sellerId: dto.sellerId, productId: dto.productId ?? null,
        placement: PLACEMENT[dto.placement], startsAt: new Date(dto.startsAt), endsAt: new Date(dto.endsAt),
      },
    });
  }

  async updateSponsored(id: string, dto: UpdateSponsoredDto) {
    const s = await this.prisma.sponsoredListing.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Sponsored listing not found');
    return this.prisma.sponsoredListing.update({
      where: { id },
      data: { ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}) },
    });
  }

  async deleteSponsored(id: string) {
    await this.prisma.sponsoredListing.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Sponsored listing not found');
    });
    return { success: true };
  }
}
