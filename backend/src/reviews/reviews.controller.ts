import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { GenerateReviewDto } from './dto/generate-review.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { Public } from '../common/decorators/public.decorator';
import { AiRateLimitGuard } from '../common/guards/ai-rate-limit.guard';

@Controller('review')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @UseGuards(AiRateLimitGuard)
  @Post('generate')
  async generateReviews(@Body() dto: GenerateReviewDto) {
    return this.reviewsService.generateReviews(dto);
  }

  @Public()
  @Post('submit')
  async submitReview(@Body() dto: SubmitReviewDto) {
    return this.reviewsService.submitReview(dto);
  }
}
