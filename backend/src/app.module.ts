import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BusinessesModule } from './businesses/businesses.module';
import { TagsModule } from './tags/tags.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ScansModule } from './scans/scans.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { QrModule } from './qr/qr.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (env: Record<string, any>) => {
        if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
          throw new Error(
            'FATAL SECURITY CONFIG ERROR: JWT_SECRET must be set in your .env and be at least 32 characters long.',
          );
        }
        if (!env.DATABASE_URL) {
          throw new Error(
            'FATAL CONFIG ERROR: DATABASE_URL must be defined in your .env.',
          );
        }
        return env;
      },
    }),
    PrismaModule,
    AuthModule,
    BusinessesModule,
    TagsModule,
    ReviewsModule,
    FeedbackModule,
    ScansModule,
    AnalyticsModule,
    QrModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
