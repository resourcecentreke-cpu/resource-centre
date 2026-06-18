import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RecordEventDto } from './dto/record-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  // Public — frontend logs searches, product views and outbound clicks.
  @Post('events')
  @HttpCode(202)
  record(@Body() dto: RecordEventDto) {
    return this.analytics.record(dto);
  }

  @Get('admin/analytics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  summary() {
    return this.analytics.summary();
  }
}
