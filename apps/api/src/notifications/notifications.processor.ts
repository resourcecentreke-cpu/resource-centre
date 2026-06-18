import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { buildAlertMessage } from './notifications.templates';
import type { ChannelKey } from './channels/channel.interface';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    if (job.name !== 'alert-triggered') {
      this.logger.warn(`Unknown notification job: ${job.name}`);
      return undefined;
    }
    const { alertId } = job.data as { alertId: string };
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
      include: { user: true, product: true },
    });
    if (!alert || !alert.user) return { skipped: 'alert or user missing' };

    const site = this.config.get<string>('SITE_URL', 'http://localhost:3000');
    const message = buildAlertMessage({
      productName: alert.product.name,
      current: alert.product.minPrice,
      target: alert.targetPrice,
      url: `${site}/#/p/${alert.product.slug}`,
      lang: alert.user.locale === 'sw' ? 'sw' : 'en',
    });

    const channels = alert.channels.map((c) => c.toLowerCase() as ChannelKey);
    const results = await this.notifications.dispatch(
      channels,
      { email: alert.user.email, phone: alert.user.phone },
      message,
    );
    await this.prisma.alert.update({ where: { id: alertId }, data: { lastNotifiedAt: new Date() } });
    this.logger.log(`Alert ${alertId}: ${results.map((r) => `${r.channel}=${r.status}`).join(', ')}`);
    return results;
  }
}
