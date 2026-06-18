import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AlertStatus } from '@rc/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { channelToWire, channelToPrisma, statusToWire, targetHit } from './alerts.util';
import type { AlertDTO } from '@rc/types';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('alerts') private readonly queue: Queue,
    @InjectQueue('notifications') private readonly notifyQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateAlertDto): Promise<AlertDTO> {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    const channels = (dto.channels?.length ? dto.channels : ['email']).map(channelToPrisma);

    const alert = await this.prisma.alert.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      update: { targetPrice: dto.targetPrice, channels, status: AlertStatus.ACTIVE },
      create: { userId, productId: dto.productId, targetPrice: dto.targetPrice, channels },
      include: { product: true },
    });
    return this.toDto(alert);
  }

  async listMine(userId: string): Promise<AlertDTO[]> {
    const alerts = await this.prisma.alert.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    return alerts.map((a) => this.toDto(a));
  }

  async update(userId: string, id: string, dto: UpdateAlertDto): Promise<AlertDTO> {
    await this.ownOrThrow(userId, id);
    const alert = await this.prisma.alert.update({
      where: { id },
      data: {
        ...(dto.targetPrice !== undefined ? { targetPrice: dto.targetPrice } : {}),
        ...(dto.channels ? { channels: dto.channels.map(channelToPrisma) } : {}),
        ...(dto.status ? { status: dto.status.toUpperCase() as AlertStatus } : {}),
      },
      include: { product: true },
    });
    return this.toDto(alert);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    await this.ownOrThrow(userId, id);
    await this.prisma.alert.delete({ where: { id } });
    return { success: true };
  }

  /** Enqueue an immediate evaluation pass (also runs on a repeating schedule). */
  async enqueueEvaluation(): Promise<{ queued: true }> {
    await this.queue.add('evaluate', {}, { removeOnComplete: true, removeOnFail: 50 });
    return { queued: true };
  }

  /** Core job logic: flag ACTIVE alerts whose product hit the target price. */
  async evaluateAll(): Promise<{ evaluated: number; triggered: number }> {
    const active = await this.prisma.alert.findMany({
      where: { status: AlertStatus.ACTIVE },
      include: { product: { select: { minPrice: true } } },
    });
    let triggered = 0;
    for (const a of active) {
      if (targetHit(a.product.minPrice, a.targetPrice)) {
        await this.prisma.alert.update({ where: { id: a.id }, data: { status: AlertStatus.TRIGGERED } });
        triggered++;
        await this.notifyQueue.add(
          'alert-triggered',
          { alertId: a.id },
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: 50 },
        );
      }
    }
    this.logger.log(`Alert evaluation: ${active.length} checked, ${triggered} triggered`);
    return { evaluated: active.length, triggered };
  }

  private async ownOrThrow(userId: string, id: string): Promise<void> {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert || alert.userId !== userId) throw new NotFoundException('Alert not found');
  }

  private toDto(a: {
    id: string; targetPrice: number; channels: string[]; status: string;
    lastNotifiedAt: Date | null; createdAt: Date;
    product: { slug: string; name: string; images: unknown; minPrice: number };
  }): AlertDTO {
    const image = Array.isArray(a.product.images) && a.product.images.length
      ? String((a.product.images as unknown[])[0]) : null;
    return {
      id: a.id,
      productSlug: a.product.slug,
      productName: a.product.name,
      image,
      targetPrice: a.targetPrice,
      currentPrice: a.product.minPrice,
      targetHit: targetHit(a.product.minPrice, a.targetPrice),
      channels: a.channels.map((c) => channelToWire(c as never)),
      status: statusToWire(a.status as never),
      lastNotifiedAt: a.lastNotifiedAt ? a.lastNotifiedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
    };
  }
}
