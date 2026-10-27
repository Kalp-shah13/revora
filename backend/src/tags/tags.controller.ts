import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, DeleteTagDto } from './dto/create-tag.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Roles('business_owner', 'super_admin')
  @Get('dashboard/tags')
  async getTagsForOwner(
    @CurrentUser('id') ownerId: string,
    @Query('businessId') businessId?: string,
  ) {
    return this.tagsService.getTagsForOwner(ownerId, businessId);
  }

  @Roles('business_owner')
  @Post('dashboard/tags')
  async createTagForOwner(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.createTagForOwner(ownerId, dto);
  }

  @Roles('business_owner')
  @Delete('dashboard/tags')
  async deleteTagForOwner(
    @CurrentUser('id') ownerId: string,
    @Body() dto: DeleteTagDto,
  ) {
    return this.tagsService.deleteTagForOwner(ownerId, dto.id);
  }

  @Roles('super_admin')
  @Get('admin/businesses/:id/tags')
  async getTagsByBusinessIdAdmin(@Param('id') businessId: string) {
    return this.tagsService.getTagsByBusinessIdAdmin(businessId);
  }

  @Public()
  @Get('tags/business/:businessId')
  async getTagsByBusinessIdPublic(@Param('businessId') businessId: string) {
    return this.tagsService.getTagsByBusinessIdAdmin(businessId);
  }

  @Public()
  @Get('tags/:businessId')
  async getTagsByBusinessIdShort(@Param('businessId') businessId: string) {
    return this.tagsService.getTagsByBusinessIdAdmin(businessId);
  }
}
