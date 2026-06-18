import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser, type RequestUser } from '../auth/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.userId, dto);
  }

  @Get('product/:slug')
  forProduct(@Param('slug') slug: string) {
    return this.reviews.listForProduct(slug);
  }

  @Get('seller/:slug')
  forSeller(@Param('slug') slug: string) {
    return this.reviews.listForSeller(slug);
  }

  @Get('pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  pending() {
    return this.reviews.pending();
  }

  @Patch(':id/moderate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviews.moderate(id, dto.status);
  }
}
