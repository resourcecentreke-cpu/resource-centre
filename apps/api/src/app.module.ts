import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { SearchModule } from './search/search.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TrustModule } from './trust/trust.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SellersModule } from './sellers/sellers.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GoModule } from './go/go.module';
import { SponsoredModule } from './sponsored/sponsored.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { ManageModule } from './manage/manage.module';
import { parseRedisUrl } from './common/redis.util';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: parseRedisUrl(config.get<string>('REDIS_URL', 'redis://localhost:6379')),
      }),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    SearchModule,
    NotificationsModule,
    AlertsModule,
    TrustModule,
    ReviewsModule,
    SellersModule,
    IngestionModule,
    PaymentsModule,
    AnalyticsModule,
    GoModule,
    SponsoredModule,
    OrdersModule,
    AdminModule,
    ManageModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
