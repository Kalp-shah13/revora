import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ─── Owner Business Analytics ───────────────────────────────────────────────

  async getAnalyticsForOwner(ownerId: string, businessId?: string) {
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

    return this.calculateBusinessAnalytics(business.id);
  }

  // ─── Admin Single Business Analytics ────────────────────────────────────────

  async getAnalyticsForBusinessIdAdmin(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.calculateBusinessAnalytics(business.id);
  }

  // ─── Platform-Wide Admin Analytics ──────────────────────────────────────────

  async getPlatformAnalyticsAdmin() {
    const [
      totalBusinesses,
      activeBusinesses,
      totalScans,
      totalReviews,
      totalFeedback,
      googleRedirects,
    ] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { isActive: true } }),
      this.prisma.qrScan.count(),
      this.prisma.review.count(),
      this.prisma.feedback.count(),
      this.prisma.review.count({ where: { redirectedToGoogle: true } }),
    ]);

    const platformConversionRate =
      totalScans > 0 ? googleRedirects / totalScans : 0;

    return {
      data: {
        total_businesses: totalBusinesses,
        active_businesses: activeBusinesses,
        total_scans: totalScans,
        total_reviews: totalReviews,
        total_feedback: totalFeedback,
        platform_conversion_rate: platformConversionRate,
      },
    };
  }

  // ─── Helper Calculator ──────────────────────────────────────────────────────

  private async calculateBusinessAnalytics(businessId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalScans,
      scansToday,
      scansWeek,
      scansMonth,
      reviews,
      feedbackItems,
    ] = await Promise.all([
      this.prisma.qrScan.count({ where: { businessId } }),
      this.prisma.qrScan.count({
        where: { businessId, scannedAt: { gte: startOfToday } },
      }),
      this.prisma.qrScan.count({
        where: { businessId, scannedAt: { gte: startOfWeek } },
      }),
      this.prisma.qrScan.count({
        where: { businessId, scannedAt: { gte: startOfMonth } },
      }),
      this.prisma.review.findMany({
        where: { businessId },
        select: { rating: true, redirectedToGoogle: true, createdAt: true },
      }),
      this.prisma.feedback.findMany({
        where: { businessId },
        select: { rating: true },
      }),
    ]);

    const allRatings = [
      ...reviews.map((r) => r.rating),
      ...feedbackItems.map((f) => f.rating),
    ];

    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;

    const googleRedirects = reviews.filter((r) => r.redirectedToGoogle).length;
    const conversionRate = totalScans > 0 ? googleRedirects / totalScans : 0;

    const reviewsThisMonth = reviews.filter((r) => r.createdAt >= startOfMonth).length;

    const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: allRatings.filter((rating) => rating === r).length,
    }));

    return {
      data: {
        total_scans: totalScans,
        total_scans_today: scansToday,
        total_scans_week: scansWeek,
        total_scans_month: scansMonth,
        average_rating: averageRating,
        conversion_rate: conversionRate,
        reviews_this_month: reviewsThisMonth,
        rating_distribution: ratingDistribution,
      },
    };
  }
}
