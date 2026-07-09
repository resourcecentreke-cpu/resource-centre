import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // ── Public checkout ────────────────────────────────────────────────────
  @Get('orders/quote/:offerId')
  @ApiOperation({ summary: 'Price breakdown (item + service fee) for an offer' })
  quote(@Param('offerId') offerId: string) {
    return this.orders.quote(offerId);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place a concierge order — we buy from the store for the customer. Triggers an M-Pesa STK push.' })
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Order status (polled by the checkout page)' })
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }

  // ── Admin fulfilment ───────────────────────────────────────────────────
  @Get('admin/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  list(@Query('status') status?: string) {
    return this.orders.adminList(status);
  }

  @Patch('admin/orders/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orders.adminUpdateStatus(id, body.status);
  }
}
