import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SellersService } from './sellers.service';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellers: SellersService) {}

  @Get()
  list() {
    return this.sellers.list();
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.sellers.bySlug(slug);
  }
}
