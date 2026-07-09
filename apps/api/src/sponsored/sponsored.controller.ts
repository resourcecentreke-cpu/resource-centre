import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SponsoredService } from './sponsored.service';

@ApiTags('sponsored')
@Controller('sponsored')
export class SponsoredController {
  constructor(private readonly sponsored: SponsoredService) {}

  @Get()
  @ApiOperation({ summary: 'Active sponsored listings for a placement (home | category | product)' })
  list(@Query('placement') placement = 'home') {
    return this.sponsored.active(placement);
  }
}
