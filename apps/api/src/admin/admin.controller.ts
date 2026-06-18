import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateProductDto, UpdateProductDto } from './dto/product-admin.dto';
import { UpdateSellerDto } from './dto/seller-admin.dto';
import { CreateSponsoredDto, UpdateSponsoredDto } from './dto/sponsored-admin.dto';
import { UpsertOfferDto } from './dto/offer-admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // Products
  @Get('products')
  listProducts(@Query('q') q?: string) {
    return this.admin.listProducts(q);
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.admin.createProduct(dto);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.admin.updateProduct(id, dto);
  }

  // Offers (per-product store prices)
  @Get('products/:id/offers')
  listOffers(@Param('id') id: string) {
    return this.admin.listOffers(id);
  }

  @Put('products/:id/offers')
  upsertOffer(@Param('id') id: string, @Body() dto: UpsertOfferDto) {
    return this.admin.upsertOffer(id, dto);
  }

  @Delete('offers/:offerId')
  deleteOffer(@Param('offerId') offerId: string) {
    return this.admin.deleteOffer(offerId);
  }

  // Sellers
  @Get('sellers')
  listSellers() {
    return this.admin.listSellers();
  }

  @Patch('sellers/:id')
  updateSeller(@Param('id') id: string, @Body() dto: UpdateSellerDto) {
    return this.admin.updateSeller(id, dto);
  }

  // Sponsored
  @Get('sponsored')
  listSponsored() {
    return this.admin.listSponsored();
  }

  @Post('sponsored')
  createSponsored(@Body() dto: CreateSponsoredDto) {
    return this.admin.createSponsored(dto);
  }

  @Patch('sponsored/:id')
  updateSponsored(@Param('id') id: string, @Body() dto: UpdateSponsoredDto) {
    return this.admin.updateSponsored(id, dto);
  }

  @Delete('sponsored/:id')
  deleteSponsored(@Param('id') id: string) {
    return this.admin.deleteSponsored(id);
  }
}
