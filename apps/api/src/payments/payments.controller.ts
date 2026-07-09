import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { InitiateTipDto } from './dto/initiate-tip.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // Public — triggers an STK push to the supporter's phone for a voluntary tip.
  @Post('tip')
  tip(@Body() dto: InitiateTipDto) {
    return this.payments.tip(dto);
  }

  @Post('stk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.payments.initiate(dto);
  }

  // Public — called by Safaricom Daraja. No guard.
  @Post('callback')
  callback(@Body() body: unknown) {
    return this.payments.handleCallback(body);
  }

  // Public — called by IntaSend on invoice state changes (tips + orders).
  // Verified via the shared challenge configured in the IntaSend dashboard.
  @Post('intasend-webhook')
  intasendWebhook(@Body() body: unknown) {
    return this.payments.handleIntasendWebhook(body);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  status(@Param('id') id: string) {
    return this.payments.getStatus(id);
  }
}
