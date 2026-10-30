import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TagType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async getTagsForOwner(ownerId: string, businessId?: string) {
    const whereClause: any = { ownerId };
    if (businessId) {
      whereClause.id = businessId;
    }
    const business = await this.prisma.business.findFirst({
      where: whereClause,
    });

    if (!business) {
      throw new NotFoundException('Business not found for this account');
    }

    const tags = await this.prisma.serviceTag.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'asc' },
    });

    const mapped = tags.map((t) => ({
      id: t.id,
      business_id: t.businessId,
      label: t.label,
      tag_type: t.tagType.toLowerCase(),
      created_at: t.createdAt,
    }));

    return { data: mapped };
  }

  async createTagForOwner(ownerId: string, dto: CreateTagDto) {
    const whereClause: any = { ownerId };
    if (dto.business_id) {
      whereClause.id = dto.business_id;
    }
    const business = await this.prisma.business.findFirst({
      where: whereClause,
    });

    if (!business) {
      throw new NotFoundException('Business not found for this account');
    }

    const cleanLabel = dto.label.trim();
    if (!cleanLabel) {
      throw new BadRequestException('Invalid tag label');
    }

    const tagType = dto.tag_type === 'category' ? TagType.CATEGORY : TagType.SERVICE;

    const created = await this.prisma.serviceTag.create({
      data: {
        businessId: business.id,
        label: cleanLabel,
        tagType,
      },
    });

    return {
      data: {
        id: created.id,
        business_id: created.businessId,
        label: created.label,
        tag_type: created.tagType.toLowerCase(),
        created_at: created.createdAt,
      },
    };
  }

  async deleteTagForOwner(ownerId: string, tagId: string) {
    const tag = await this.prisma.serviceTag.findUnique({
      where: { id: tagId },
      include: { business: true },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.business?.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this tag');
    }

    await this.prisma.serviceTag.delete({
      where: { id: tagId },
    });

    return { data: { success: true } };
  }

  async getTagsByBusinessIdAdmin(businessId: string) {
    const tags = await this.prisma.serviceTag.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    });

    const mapped = tags.map((t) => ({
      id: t.id,
      business_id: t.businessId,
      label: t.label,
      tag_type: t.tagType.toLowerCase(),
      created_at: t.createdAt,
    }));

    return { data: mapped };
  }
}
