import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CategoryDTO } from '@rc/types';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CategoryDTO[]> {
    const cats = await this.prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return cats.map((c) => ({
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      productCount: c._count.products,
    }));
  }

  async bySlug(slug: string): Promise<CategoryDTO> {
    const c = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!c) throw new NotFoundException(`Category "${slug}" not found`);
    return { name: c.name, slug: c.slug, icon: c.icon, productCount: c._count.products };
  }
}
