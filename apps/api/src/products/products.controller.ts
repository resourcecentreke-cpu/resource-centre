import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ProductQueryDto) {
    return this.products.list(query);
  }

  // Must be declared before ':slug' so "deals" is not matched as a product slug.
  @Get('deals')
  deals(@Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number) {
    return this.products.deals(Math.min(Math.max(limit, 1), 60));
  }

  // "Top 10 by interest" — optional ?category=<slug> to scope the ranking.
  // Declared before ':slug' so "top-interest" is not matched as a product slug.
  @Get('top-interest')
  topInterest(
    @Query('category') category: string | undefined,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.products.topByInterest(category, Math.min(Math.max(limit, 1), 50));
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.products.detail(slug);
  }
}
