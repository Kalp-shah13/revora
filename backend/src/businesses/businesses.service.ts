import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { validateAndNormalizeGoogleReviewLink } from '../common/utils/google-link.validator';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  async getPublicBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        serviceTags: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!business || !business.isActive) {
      throw new NotFoundException('Business not found or inactive');
    }

    const publicBusiness = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      logo_url: business.logoUrl,
      accent_color: business.accentColor,
      google_review_link: business.googleReviewLink,
    };

    const tags = business.serviceTags.map((tag) => ({
      id: tag.id,
      business_id: tag.businessId,
      label: tag.label,
      tag_type: tag.tagType.toLowerCase(),
      created_at: tag.createdAt,
    }));

    return {
      data: {
        business: publicBusiness,
        tags,
      },
    };
  }

  // ─── Owner API ──────────────────────────────────────────────────────────────

  async getMyBusiness(ownerId: string, businessId?: string) {
    const whereClause: any = { ownerId };
    if (businessId) {
      whereClause.id = businessId;
    }
    const business = await this.prisma.business.findFirst({
      where: whereClause,
      include: {
        serviceTags: { orderBy: { createdAt: 'asc' } },
        feedback: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!business) {
      return { data: null };
    }

    return {
      data: {
        id: business.id,
        owner_id: business.ownerId,
        name: business.name,
        slug: business.slug,
        google_review_link: business.googleReviewLink,
        logo_url: business.logoUrl,
        accent_color: business.accentColor,
        plan: business.plan.toLowerCase(),
        is_active: business.isActive,
        created_at: business.createdAt,
        service_tags: business.serviceTags.map((t) => ({
          id: t.id,
          business_id: t.businessId,
          label: t.label,
          tag_type: t.tagType.toLowerCase(),
          created_at: t.createdAt,
        })),
        feedback: business.feedback.map((f) => ({
          id: f.id,
          business_id: f.businessId,
          rating: f.rating,
          message: f.message,
          contact_info: f.contactInfo,
          status: f.status.toLowerCase(),
          created_at: f.createdAt,
        })),
      },
    };
  }

  async getMyBusinesses(ownerId: string) {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        googleReviewLink: true,
        logoUrl: true,
        accentColor: true,
        plan: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      data: businesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        google_review_link: b.googleReviewLink,
        logo_url: b.logoUrl,
        accent_color: b.accentColor,
        plan: b.plan.toLowerCase(),
        is_active: b.isActive,
        created_at: b.createdAt,
      })),
    };
  }

  // ─── Admin APIs ─────────────────────────────────────────────────────────────

  async getAllForAdmin() {
    const businesses = await this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { fullName: true, email: true } },
        _count: { select: { qrScans: true } },
      },
    });

    const rows = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      google_review_link: b.googleReviewLink,
      logo_url: b.logoUrl,
      accent_color: b.accentColor,
      plan: b.plan.toLowerCase(),
      is_active: b.isActive,
      created_at: b.createdAt,
      profiles: { full_name: b.owner?.fullName || b.owner?.email || null },
      scan_count: [{ count: b._count.qrScans }],
    }));

    return { data: rows };
  }

  async getByIdForAdmin(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return {
      data: {
        id: business.id,
        owner_id: business.ownerId,
        name: business.name,
        slug: business.slug,
        google_review_link: business.googleReviewLink,
        logo_url: business.logoUrl,
        accent_color: business.accentColor,
        plan: business.plan.toLowerCase(),
        is_active: business.isActive,
        created_at: business.createdAt,
        owner: business.owner,
      },
    };
  }

  async createForAdmin(dto: CreateBusinessDto) {
    const slug = dto.slug?.trim() || generateSlug(dto.name);

    const existingSlug = await this.prisma.business.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    let ownerId = dto.owner_id;

    // Handle new owner creation directly from modal
    if (dto.new_owner) {
      const email = dto.new_owner.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        ownerId = existingUser.id;
      } else {
        const hashedPassword = await bcrypt.hash(dto.new_owner.password, 10);
        const newUser = await this.prisma.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            fullName: dto.new_owner.full_name?.trim() || null,
            role: Role.BUSINESS_OWNER,
          },
        });
        ownerId = newUser.id;
      }
    }

    if (!ownerId) {
      throw new BadRequestException('Please select an existing owner or enter new owner details');
    }

    const googleValidation = validateAndNormalizeGoogleReviewLink(dto.google_review_link);
    const normalizedLink = googleValidation.normalizedUrl || dto.google_review_link.trim();

    const business = await this.prisma.business.create({
      data: {
        name: dto.name.trim(),
        slug,
        googleReviewLink: normalizedLink,
        ownerId,
        plan: dto.plan || 'FREE',
        logoUrl: dto.logo_url || null,
        accentColor: dto.accent_color || '#D97706',
        isActive: true,
      },
    });

    // Seed initial tags so the business is immediately functional
    await this.prisma.serviceTag.createMany({
      data: [
        { businessId: business.id, label: 'General Service', tagType: 'SERVICE' },
        { businessId: business.id, label: 'Friendly Staff', tagType: 'CATEGORY' },
        { businessId: business.id, label: 'Great Experience', tagType: 'CATEGORY' },
        { businessId: business.id, label: 'Clean & Modern', tagType: 'CATEGORY' },
      ],
      skipDuplicates: true,
    });

    return {
      data: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        google_review_link: business.googleReviewLink,
        owner_id: business.ownerId,
        plan: business.plan.toLowerCase(),
        logo_url: business.logoUrl,
        accent_color: business.accentColor,
        is_active: business.isActive,
        created_at: business.createdAt,
      },
    };
  }

  async updateForAdmin(id: string, dto: UpdateBusinessDto) {
    const existing = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Business not found');
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugCheck = await this.prisma.business.findUnique({
        where: { slug: dto.slug },
      });
      if (slugCheck) {
        throw new ConflictException('Slug already exists');
      }
    }

    let normalizedGoogleLink: string | undefined;
    if (dto.google_review_link !== undefined) {
      const googleValidation = validateAndNormalizeGoogleReviewLink(dto.google_review_link);
      normalizedGoogleLink = googleValidation.normalizedUrl || dto.google_review_link.trim();
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.slug !== undefined && { slug: dto.slug.trim() }),
        ...(normalizedGoogleLink !== undefined && {
          googleReviewLink: normalizedGoogleLink,
        }),
        ...(dto.logo_url !== undefined && { logoUrl: dto.logo_url }),
        ...(dto.accent_color !== undefined && { accentColor: dto.accent_color }),
        ...(dto.plan !== undefined && { plan: dto.plan }),
        ...(dto.is_active !== undefined && { isActive: dto.is_active }),
      },
    });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        google_review_link: updated.googleReviewLink,
        logo_url: updated.logoUrl,
        accent_color: updated.accentColor,
        plan: updated.plan.toLowerCase(),
        is_active: updated.isActive,
        created_at: updated.createdAt,
      },
    };
  }

  async deleteForAdmin(id: string) {
    const existing = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Business not found');
    }

    await this.prisma.business.update({
      where: { id },
      data: { isActive: false },
    });

    return { data: { success: true, message: 'Business deactivated' } };
  }

  async getOwnersForAdmin() {
    const owners = await this.prisma.user.findMany({
      where: { role: Role.BUSINESS_OWNER },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const mapped = owners.map((o) => ({
      id: o.id,
      email: o.email,
      full_name: o.fullName,
    }));

    return { data: mapped };
  }
}
