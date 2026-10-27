import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FeedbackStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFeedbackStatusDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async getFeedbackForOwner(ownerId: string, businessId?: string) {
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

    const items = await this.prisma.feedback.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = items.map((f) => ({
      id: f.id,
      business_id: f.businessId,
      rating: f.rating,
      message: f.message,
      contact_info: f.contactInfo,
      status: f.status.toLowerCase(),
      created_at: f.createdAt,
    }));

    return { data: mapped };
  }

  async getFeedbackByBusinessId(businessId: string, user?: { id: string; role: string }) {
    if (user && user.role?.toLowerCase() !== 'super_admin') {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true },
      });

      if (!business) {
        throw new NotFoundException('Business not found');
      }

      if (business.ownerId !== user.id) {
        throw new ForbiddenException('You do not have permission to access feedback for this business');
      }
    }

    const items = await this.prisma.feedback.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = items.map((f) => ({
      id: f.id,
      business_id: f.businessId,
      rating: f.rating,
      message: f.message,
      contact_info: f.contactInfo,
      status: f.status.toLowerCase(),
      created_at: f.createdAt,
    }));

    return { data: mapped };
  }

  async updateFeedbackStatus(ownerId: string, dto: UpdateFeedbackStatusDto) {
    const item = await this.prisma.feedback.findUnique({
      where: { id: dto.id },
      include: { business: true },
    });

    if (!item) {
      throw new NotFoundException('Feedback not found');
    }

    if (item.business?.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this feedback item');
    }

    const newStatus =
      dto.status === 'resolved' ? FeedbackStatus.RESOLVED : FeedbackStatus.OPEN;

    await this.prisma.feedback.update({
      where: { id: dto.id },
      data: { status: newStatus },
    });

    return { data: { success: true } };
  }
}
