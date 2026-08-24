/**
 * GET /api/dashboard/analytics
 * Authenticated — business owner only (RLS enforced).
 * Returns scan counts, average rating, conversion rate, rating distribution.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBusinessByOwnerId, getScanCounts, getReviews, getFeedback } from '@/lib/db'

export async function GET(_request: NextRequest) {
  const check = await requireRole('business_owner')
  if (!check.authorized) return check.response

  try {
    const supabase = await createServerSupabaseClient()
    const ownerId = check.auth.profile.id

    const business = await getBusinessByOwnerId(supabase, ownerId)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const [scanCounts, reviews, feedbackItems] = await Promise.all([
      getScanCounts(supabase, business.id),
      getReviews(supabase, business.id),
      getFeedback(supabase, business.id),
    ])

    const allRatings = [
      ...reviews.map((r) => r.rating),
      ...feedbackItems.map((f) => f.rating),
    ]

    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0

    const googleRedirects = reviews.filter((r) => r.redirected_to_google).length
    const conversionRate =
      scanCounts.total > 0 ? googleRedirects / scanCounts.total : 0

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString()

    const reviewsThisMonth = reviews.filter(
      (r) => r.created_at >= startOfMonth
    ).length

    const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: allRatings.filter((rating) => rating === r).length,
    }))

    return NextResponse.json({
      data: {
        total_scans: scanCounts.total,
        total_scans_today: scanCounts.today,
        total_scans_week: scanCounts.week,
        total_scans_month: scanCounts.month,
        average_rating: averageRating,
        conversion_rate: conversionRate,
        reviews_this_month: reviewsThisMonth,
        rating_distribution: ratingDistribution,
      },
    })
  } catch (error) {
    console.error('[GET /api/dashboard/analytics]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
