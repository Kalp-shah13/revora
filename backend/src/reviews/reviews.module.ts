import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { AiRateLimitGuard } from '../common/guards/ai-rate-limit.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, AiRateLimitGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}
