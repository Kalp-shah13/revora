import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  // ─── Business Owner Routes (defined before :slug to prevent route interception) ───

  @Roles('business_owner', 'super_admin')
  @Get('business/mine')
  async getMyBusiness(
    @CurrentUser('id') userId: string,
    @Query('businessId') businessId?: string,
  ) {
    return this.businessesService.getMyBusiness(userId, businessId);
  }

  @Roles('business_owner', 'super_admin')
  @Get('business/my-list')
  async getMyBusinesses(@CurrentUser('id') userId: string) {
    return this.businessesService.getMyBusinesses(userId);
  }

  @Roles('business_owner', 'super_admin')
  @Get('business/by-owner/:ownerId')
  async getByOwnerId(
    @Param('ownerId') ownerId: string,
    @CurrentUser() user: any,
    @Query('businessId') businessId?: string,
  ) {
    if (user?.role?.toLowerCase() !== 'super_admin' && user?.id !== ownerId) {
      throw new ForbiddenException("You do not have permission to access another owner's business");
    }
    return this.businessesService.getMyBusiness(ownerId, businessId);
  }

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('business/:slug')
  async getPublicBySlug(@Param('slug') slug: string) {
    return this.businessesService.getPublicBySlug(slug);
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────────

  @Roles('super_admin')
  @Get('admin/businesses')
  async getAllForAdmin() {
    return this.businessesService.getAllForAdmin();
  }

  @Roles('super_admin')
  @Post('admin/businesses')
  async createForAdmin(@Body() dto: CreateBusinessDto) {
    return this.businessesService.createForAdmin(dto);
  }

  @Roles('super_admin')
  @Get('admin/businesses/:id')
  async getByIdForAdmin(@Param('id') id: string) {
    return this.businessesService.getByIdForAdmin(id);
  }

  @Roles('super_admin')
  @Put('admin/businesses/:id')
  async updateForAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessesService.updateForAdmin(id, dto);
  }

  @Roles('super_admin')
  @Delete('admin/businesses/:id')
  async deleteForAdmin(@Param('id') id: string) {
    return this.businessesService.deleteForAdmin(id);
  }

  @Roles('super_admin')
  @Get('admin/owners')
  async getOwnersForAdmin() {
    return this.businessesService.getOwnersForAdmin();
  }
}
