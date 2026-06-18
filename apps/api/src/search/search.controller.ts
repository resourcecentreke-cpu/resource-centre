import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { ProductQueryDto } from '../products/dto/product-query.dto';
import { AutocompleteDto } from './dto/autocomplete.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  query(@Query() query: ProductQueryDto) {
    return this.search.search(query);
  }

  @Get('autocomplete')
  autocomplete(@Query() dto: AutocompleteDto) {
    return this.search.autocomplete(dto);
  }
}
