import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { IntasendService } from '../payments/intasend.service';
import { normalizeMsisdn, isValidMsisdn } from '../mpesa/mpesa.util';
import { parseFeeConfig, computeServiceFee, OrderFeeConfig } from './order-fee.util';
import { CreateOrderDto } from './dto/create-order.dto';
import type { OrderDTO, OrderQuoteDTO, CreateOrderResponse } from '@rc/types';

const STATUS_WIRE: Record<OrderStatus, OrderDTO['status']> = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PURCHASING: 'purchasing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly fee: OrderFeeConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly intasend: IntasendService,
    config: ConfigService,
  ) {
    this.fee = parseFeeConfig({
      ORDER_FEE_PCT: config.get('ORDER_FEE_PCT'),
      ORDER_FEE_MIN: config.get('ORDER_FEE_MIN'),
      ORDER_FEE_MAX: config.get('ORDER_FEE_MAX'),
    });
  }

  /** Price breakdown shown on the checkout page before the customer commits. */
  async quote(offerId: string): Promise<OrderQuoteDTO> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { seller: true, product: { select: { name: true, slug: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    const serviceFee = computeServiceFee(offer.price, this.fee);
    return {
      offerId: offer.id,
      productName: offer.product.name,
      productSlug: offer.product.slug,
      sellerName: offer.seller.name,
      unitPrice: offer.price,
      serviceFee,
      total: offer.price + serviceFee,
      inStock: offer.inStock !== 'OUT',
    };
  }

  /** Create the order and fire the M-Pesa STK push. */
  async create(dto: CreateOrderDto): Promise<CreateOrderResponse> {
    if (!this.intasend.isConfigured()) {
      throw new ServiceUnavailableException('Checkout is not configured on this server');
    }
    const msisdn = normalizeMsisdn(dto.phone);
    if (!isValidMsisdn(msisdn)) throw new BadRequestException('Invalid M-Pesa phone number');

    const offer = await this.prisma.offer.findUnique({
      where: { id: dto.offerId },
      include: { seller: true, product: { select: { id: true, name: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.inStock === 'OUT') throw new BadRequestException('This offer is out of stock');

    // Server-derived amounts — never trust the client.
    const unitPrice = offer.price;
    const serviceFee = computeServiceFee(unitPrice, this.fee);
    const total = unitPrice + serviceFee;

    const order = await this.prisma.order.create({
      data: {
        productId: offer.product.id,
        sellerId: offer.sellerId,
        offerId: offer.id,
        unitPrice,
        serviceFee,
        total,
        customerName: dto.customerName.trim(),
        phone: msisdn,
        email: dto.email?.trim() || null,
        city: dto.city.trim(),
        address: dto.address.trim(),
        notes: dto.notes?.trim() || null,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        sellerId: offer.sellerId,
        amount: total,
        purpose: 'order',
        reference: order.id,
        status: PaymentStatus.PENDING,
      },
    });

    const push = await this.intasend.stkPush({ amount: total, phone: msisdn, ref: order.id });

    await Promise.all([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { mpesaCheckoutId: push.invoiceId },
      }),
      this.prisma.order.update({ where: { id: order.id }, data: { paymentId: payment.id } }),
    ]);

    this.logger.log(`Order ${order.id} created (KES ${total}) — STK push sent to ${msisdn}`);
    return {
      orderId: order.id,
      paymentId: payment.id,
      total,
      customerMessage: 'Check your phone and enter your M-Pesa PIN to pay.',
    };
  }

  /** Public status endpoint the checkout page polls. */
  async get(id: string): Promise<OrderDTO> {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        product: { select: { name: true, slug: true } },
        seller: { select: { name: true } },
        payment: { select: { status: true, mpesaReceipt: true } },
      },
    });
    if (!o) throw new NotFoundException('Order not found');
    return this.toDTO(o);
  }

  /** Called by the payments webhook when an order payment completes. */
  async markPaid(orderId: string): Promise<void> {
    // updateMany so the status filter keeps this idempotent (no-op if already paid/cancelled).
    await this.prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
      data: { status: OrderStatus.PAID },
    });
  }

  // ── Admin ──────────────────────────────────────────────────────────────
  async adminList(status?: string): Promise<OrderDTO[]> {
    const where = status
      ? { status: status.toUpperCase() as OrderStatus }
      : {};
    const rows = await this.prisma.order.findMany({
      where,
      include: {
        product: { select: { name: true, slug: true } },
        seller: { select: { name: true } },
        payment: { select: { status: true, mpesaReceipt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((o) => this.toDTO(o));
  }

  async adminUpdateStatus(id: string, status: string): Promise<OrderDTO> {
    const wire = Object.entries(STATUS_WIRE).find(([, v]) => v === status)?.[0] as
      | OrderStatus
      | undefined;
    if (!wire) throw new BadRequestException(`Unknown status "${status}"`);
    await this.prisma.order.update({ where: { id }, data: { status: wire } });
    return this.get(id);
  }

  private toDTO(o: {
    id: string;
    unitPrice: number;
    serviceFee: number;
    total: number;
    customerName: string;
    phone: string;
    email: string | null;
    city: string;
    address: string;
    notes: string | null;
    status: OrderStatus;
    createdAt: Date;
    product: { name: string; slug: string };
    seller: { name: string } | null;
    payment: { status: PaymentStatus; mpesaReceipt: string | null } | null;
  }): OrderDTO {
    return {
      id: o.id,
      productName: o.product.name,
      productSlug: o.product.slug,
      sellerName: o.seller?.name ?? null,
      unitPrice: o.unitPrice,
      serviceFee: o.serviceFee,
      total: o.total,
      customerName: o.customerName,
      phone: o.phone,
      email: o.email,
      city: o.city,
      address: o.address,
      notes: o.notes,
      status: STATUS_WIRE[o.status],
      paymentStatus: (o.payment?.status.toLowerCase() ?? null) as OrderDTO['paymentStatus'],
      mpesaReceipt: o.payment?.mpesaReceipt ?? null,
      createdAt: o.createdAt.toISOString(),
    };
  }
}
