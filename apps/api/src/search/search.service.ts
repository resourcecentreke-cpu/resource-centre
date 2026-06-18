import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, type Index } from 'meilisearch';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { ProductQueryDto } from '../products/dto/product-query.dto';
import { AutocompleteDto } from './dto/autocomplete.dto';
import { buildMeiliFilter, buildMeiliSort, PRODUCTS_INDEX, INDEX_SETTINGS } from './search.util';
import type { Paginated, ProductSummaryDTO, SearchSuggestion } from '@rc/types';

interface ProductDoc {
  id: string; slug: string; name: string; brand: string;
  category: string; categorySlug: string; specSummary: string;
  image: string | null; minPrice: number; maxPrice: number;
  isNew: boolean; offerCount: number; inStock: boolean; createdAtTs: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const host = this.config.get<string>('MEILI_HOST');
    const apiKey = this.config.get<string>('MEILI_MASTER_KEY');
    if (!host) {
      this.logger.warn('MEILI_HOST not set — search will fall back to the database.');
      return;
    }
    this.client = new MeiliSearch({ host, apiKey });
    try {
      await this.ensureIndex();
    } catch (e) {
      this.logger.warn(`Meili not reachable at init (${(e as Error).message}). DB fallback active.`);
    }
  }

  private index(): Index<ProductDoc> {
    if (!this.client) throw new Error('Meili client unavailable');
    return this.client.index<ProductDoc>(PRODUCTS_INDEX);
  }

  async ensureIndex(): Promise<void> {
    if (!this.client) return;
    await this.client.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' }).catch(() => undefined);
    await this.index().updateSettings(INDEX_SETTINGS);
  }

  async reindexAll(): Promise<number> {
    const rows = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, offers: { select: { inStock: true } } },
    });
    const docs: ProductDoc[] = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category.name,
      categorySlug: p.category.slug,
      specSummary: p.specSummary,
      image: Array.isArray(p.images) && p.images.length ? String((p.images as unknown[])[0]) : null,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      isNew: p.isNew,
      offerCount: p.offerCount,
      inStock: p.offers.some((o) => o.inStock !== 'OUT'),
      createdAtTs: p.createdAt.getTime(),
    }));
    await this.index().addDocuments(docs, { primaryKey: 'id' });
    this.logger.log(`Reindexed ${docs.length} products into Meilisearch`);
    return docs.length;
  }

  async search(query: ProductQueryDto): Promise<Paginated<ProductSummaryDTO>> {
    if (!this.client) return this.products.list(query);
    try {
      const res = await this.index().search(query.q ?? '', {
        filter: buildMeiliFilter(query),
        sort: buildMeiliSort(query.sort),
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      const items: ProductSummaryDTO[] = (res.hits as ProductDoc[]).map((h) => ({
        id: h.id, slug: h.slug, name: h.name, brand: h.brand, category: h.category,
        categorySlug: h.categorySlug,
        specSummary: h.specSummary, image: h.image, minPrice: h.minPrice, isNew: h.isNew,
      }));
      const total = res.estimatedTotalHits ?? items.length;
      return {
        items, total, page: query.page, pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      };
    } catch (e) {
      this.logger.warn(`Search fell back to DB: ${(e as Error).message}`);
      return this.products.list(query);
    }
  }

  async autocomplete(dto: AutocompleteDto): Promise<SearchSuggestion[]> {
    if (!this.client) return this.dbAutocomplete(dto.q);
    try {
      const res = await this.index().search(dto.q, {
        limit: 6,
        attributesToRetrieve: ['slug', 'name', 'brand', 'category', 'image', 'minPrice'],
      });
      return (res.hits as ProductDoc[]).map((h) => ({
        slug: h.slug, name: h.name, brand: h.brand, category: h.category,
        image: h.image, minPrice: h.minPrice,
      }));
    } catch {
      return this.dbAutocomplete(dto.q);
    }
  }

  private async dbAutocomplete(q: string): Promise<SearchSuggestion[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { category: true },
      take: 6,
      orderBy: { minPrice: 'asc' },
    });
    return rows.map((p) => ({
      slug: p.slug, name: p.name, brand: p.brand, category: p.category.name,
      image: Array.isArray(p.images) && p.images.length ? String((p.images as unknown[])[0]) : null,
      minPrice: p.minPrice,
    }));
  }
}
