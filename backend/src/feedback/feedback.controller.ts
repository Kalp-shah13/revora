import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { UpdateFeedbackStatusDto } from './dto/update-feedback.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dashboard/feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Roles('business_owner', 'super_admin')
  @Get()
  async getFeedback(
    @CurrentUser('id') ownerId: string,
    @Query('businessId') businessId?: string,
  ) {
    return this.feedbackService.getFeedbackForOwner(ownerId, businessId);
  }

  @Roles('business_owner', 'super_admin')
  @Get('by-business/:businessId')
  async getFeedbackByBusinessId(
    @Param('businessId') businessId: string,
    @CurrentUser() user: any,
  ) {
    return this.feedbackService.getFeedbackByBusinessId(businessId, user);
  }

  @Roles('business_owner')
  @Patch()
  async updateStatus(
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.feedbackService.updateFeedbackStatus(ownerId, dto);
  }
}
