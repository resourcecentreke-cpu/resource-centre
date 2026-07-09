import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { GoService } from './go.service';

@ApiTags('go')
@Controller('go')
export class GoController {
  constructor(private readonly go: GoService) {}

  @Get(':offerId')
  @ApiOperation({
    summary:
      'Outbound redirect: logs the click and 302s to the seller page with affiliate/UTM tracking',
  })
  async redirect(@Param('offerId') offerId: string, @Res() res: Response) {
    const url = await this.go.resolve(offerId);
    res.redirect(302, url);
  }
}
