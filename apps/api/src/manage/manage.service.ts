import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slug.util';
import { CreateManagedProductDto } from './dto/create-managed-product.dto';

@Injectable()
export class ManageService {
  private readonly logger = new Logger(ManageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Folder served by the web app at /products/<file>. Override with PRODUCTS_IMAGE_DIR. */
  private imageDir(): string {
    return (
      this.config.get<string>('PRODUCTS_IMAGE_DIR') ||
      resolve(process.cwd(), '..', 'web', 'public', 'products')
    );
  }

  async meta() {
    const [categories, sellers] = await Promise.all([
      this.prisma.category.findMany({
        where: { parentId: null },
        select: { name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.seller.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);
    return { categories, sellers };
  }

  async list(q?: string) {
    const rows = await this.prisma.product.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      orderBy: { updatedAt: 'desc' },
      take: 60,
      select: {
        id: true, name: true, slug: true, images: true, minPrice: true, brand: true,
        category: { select: { name: true } },
      },
    });
    return rows.map((r) => {
      const images = Array.isArray(r.images) ? r.images.map(String) : [];
      return {
        id: r.id, name: r.name, slug: r.slug, brand: r.brand, category: r.category.name,
        minPrice: r.minPrice, images, image: images[0] ?? null,
      };
    });
  }

  async create(dto: CreateManagedProductDto) {
    const slug = slugify(dto.name);
    const exists = await this.prisma.product.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('A product with this name already exists');
    const cat = await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } });
    if (!cat) throw new BadRequestException(`Unknown category "${dto.categorySlug}"`);

    const price = Math.max(0, Math.round(dto.price));
    const product = await this.prisma.product.create({
      data: {
        slug,
        name: dto.name,
        brand: (dto.brand && dto.brand.trim()) || dto.name.split(/\s+/)[0] || dto.name,
        categoryId: cat.id,
        specSummary: dto.specSummary?.trim() || '',
        isNew: Boolean(dto.isNew),
        minPrice: price,
        maxPrice: price,
        offerCount: 0,
        images: [],
      },
    });
    this.logger.log(`Managed product created: ${product.name} (${product.slug})`);
    return { id: product.id, slug: product.slug };
  }

  /** Append one or more uploaded photos to a product's gallery. */
  async addImages(id: string, files?: Array<{ buffer: Buffer; mimetype: string }>) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (!files?.length) throw new BadRequestException('No image file uploaded');

    const dir = this.imageDir();
    await mkdir(dir, { recursive: true });
    const urls: string[] = Array.isArray(product.images) ? product.images.map(String) : [];

    for (const file of files) {
      if (!file?.buffer?.length) continue;
      if (!file.mimetype?.startsWith('image/')) throw new BadRequestException('Files must be images');
      const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      // First photo keeps the clean <slug>.<ext> name; extras get a unique suffix.
      const base = urls.length === 0 ? product.slug : `${product.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const filename = `${base}.${ext}`;
      await writeFile(join(dir, filename), file.buffer);
      urls.push(`/products/${filename}`);
    }

    await this.prisma.product.update({ where: { id }, data: { images: urls, imageSlug: null } });
    this.logger.log(`${files.length} image(s) added for ${product.slug} (now ${urls.length})`);
    return { images: urls };
  }

  /** Replace the ordered image list (used to reorder, set primary, or remove). */
  async setImages(id: string, images: string[]) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const clean = (images ?? []).filter((u) => typeof u === 'string' && u.startsWith('/products/'));
    await this.prisma.product.update({ where: { id }, data: { images: clean, imageSlug: null } });
    return { images: clean };
  }
}
