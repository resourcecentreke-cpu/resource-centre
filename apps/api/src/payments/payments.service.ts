import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PaymentStatus, SubscriptionPlan, SubscriptionStatus } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { DarajaService } from '../mpesa/daraja.service';
import { IntasendService } from './intasend.service';
import { normalizeMsisdn, isValidMsisdn, parseStkCallback } from '../mpesa/mpesa.util';
import { InitiatePaymentDto, PaymentPurposeInput, PlanInput } from './dto/initiate-payment.dto';
import { InitiateTipDto } from './dto/initiate-tip.dto';
import type { PaymentDTO, StkInitResponse } from '@rc/types';

const PLAN_PRICES: Record<PlanInput, number> = { basic: 1000, premium: 5000, enterprise: 20000 };
const PLAN_ENUM: Record<PlanInput, SubscriptionPlan> = {
  basic: SubscriptionPlan.BASIC, premium: SubscriptionPlan.PREMIUM, enterprise: SubscriptionPlan.ENTERPRISE,
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly daraja: DarajaService,
    private readonly intasend: IntasendService,
  ) {}

  /**
   * Public "tip us" — triggers an M-Pesa STK push via IntaSend (an aggregator that
   * settles to the site owner's bank account) so the supporter just confirms with
   * their PIN on their phone.
   */
  async tip(dto: InitiateTipDto): Promise<StkInitResponse> {
    if (!this.intasend.isConfigured()) {
      throw new ServiceUnavailableException('Tipping is not configured on this server');
    }
    const msisdn = normalizeMsisdn(dto.phone);
    if (!isValidMsisdn(msisdn)) throw new BadRequestException('Invalid phone number');
    const amount = Math.min(Math.max(Math.round(dto.amount), 10), 70000);

    const payment = await this.prisma.payment.create({
      data: { amount, purpose: 'tip', status: PaymentStatus.PENDING, reference: 'intasend' },
    });
    const res = await this.intasend.stkPush({ amount, phone: msisdn, ref: payment.id });
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { mpesaCheckoutId: res.invoiceId },
    });
    return {
      paymentId: payment.id,
      checkoutRequestId: res.invoiceId ?? payment.id,
      customerMessage: 'Check your phone and enter your M-Pesa PIN to complete the tip.',
    };
  }

  async initiate(dto: InitiatePaymentDto): Promise<StkInitResponse> {
    if (!this.daraja.isConfigured()) {
      throw new ServiceUnavailableException('M-Pesa is not configured on this server');
    }
    const msisdn = normalizeMsisdn(dto.phone);
    if (!isValidMsisdn(msisdn)) throw new BadRequestException('Invalid phone number');

    const seller = await this.prisma.seller.findUnique({ where: { id: dto.sellerId } });
    if (!seller) throw new NotFoundException('Seller not found');

    let amount: number;
    let reference: string;
    let description: string;

    if (dto.purpose === PaymentPurposeInput.Subscription) {
      if (!dto.plan) throw new BadRequestException('plan is required for subscription');
      amount = PLAN_PRICES[dto.plan]; // server-derived, never trust client amount
      reference = dto.plan;
      description = `Sub ${dto.plan}`;
    } else {
      if (!dto.sponsoredListingId) throw new BadRequestException('sponsoredListingId required');
      if (!dto.amount) throw new BadRequestException('amount required for sponsored');
      amount = dto.amount;
      reference = dto.sponsoredListingId;
      description = 'Sponsored';
    }

    const payment = await this.prisma.payment.create({
      data: {
        sellerId: seller.id,
        amount,
        purpose: dto.purpose,
        reference,
        status: PaymentStatus.PENDING,
      },
    });

    const push = await this.daraja.stkPush({
      amount, msisdn, accountRef: seller.slug, description,
    });
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { mpesaCheckoutId: push.checkoutRequestId },
    });

    return { paymentId: payment.id, checkoutRequestId: push.checkoutRequestId, customerMessage: push.customerMessage };
  }

  /** Public endpoint hit by Safaricom. Always returns the Daraja-expected ack. */
  async handleCallback(body: unknown): Promise<{ ResultCode: number; ResultDesc: string }> {
    const parsed = parseStkCallback(body);
    if (!parsed) {
      this.logger.warn('Unparseable M-Pesa callback');
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }
    const payment = await this.prisma.payment.findFirst({
      where: { mpesaCheckoutId: parsed.checkoutRequestId },
    });
    if (!payment || payment.status !== PaymentStatus.PENDING) {
      return { ResultCode: 0, ResultDesc: 'Accepted' }; // unknown or already processed → idempotent
    }

    if (parsed.resultCode === 0) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.COMPLETED, mpesaReceipt: parsed.receipt ?? null },
      });
      await this.fulfil(payment.id);
      this.logger.log(`Payment ${payment.id} completed (${parsed.receipt})`);
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      this.logger.warn(`Payment ${payment.id} failed: ${parsed.resultDesc}`);
    }
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  private async fulfil(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || !payment.sellerId) return;

    if (payment.purpose === 'subscription') {
      const plan = (payment.reference ?? 'basic') as PlanInput;
      const renewsAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      await this.prisma.subscription.upsert({
        where: { sellerId: payment.sellerId },
        update: { plan: PLAN_ENUM[plan], status: SubscriptionStatus.ACTIVE, mpesaRef: payment.mpesaReceipt, renewsAt },
        create: { sellerId: payment.sellerId, plan: PLAN_ENUM[plan], status: SubscriptionStatus.ACTIVE, mpesaRef: payment.mpesaReceipt, renewsAt },
      });
    } else if (payment.purpose === 'sponsored' && payment.reference) {
      await this.prisma.sponsoredListing.update({
        where: { id: payment.reference },
        data: { isActive: true, paymentId: payment.id },
      }).catch(() => this.logger.warn(`Sponsored listing ${payment.reference} not found`));
    }
  }

  async getStatus(id: string): Promise<PaymentDTO> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Payment not found');
    return {
      id: p.id,
      purpose: p.purpose as PaymentDTO['purpose'],
      amount: p.amount,
      status: p.status.toLowerCase() as PaymentDTO['status'],
      reference: p.reference,
      mpesaReceipt: p.mpesaReceipt,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
