import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Roles('business_owner', 'super_admin')
  @Get('dashboard/analytics')
  async getDashboardAnalytics(
    @CurrentUser('id') ownerId: string,
    @Query('businessId') businessId?: string,
  ) {
    return this.analyticsService.getAnalyticsForOwner(ownerId, businessId);
  }

  @Roles('super_admin')
  @Get('admin/analytics')
  async getPlatformAnalytics() {
    return this.analyticsService.getPlatformAnalyticsAdmin();
  }

  @Roles('super_admin')
  @Get('admin/businesses/:id/analytics')
  async getBusinessAnalyticsForAdmin(@Param('id') businessId: string) {
    return this.analyticsService.getAnalyticsForBusinessIdAdmin(businessId);
  }
}
