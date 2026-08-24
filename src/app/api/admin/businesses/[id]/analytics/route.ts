/**
 * GET /api/admin/businesses/[id]/analytics
 * Returns analytics for a specific business. Super admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getScanCounts, getReviews, getFeedback } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const { id } = await params
    const supabase = createServiceRoleClient()

    const [scanCounts, reviews, feedbackItems] = await Promise.all([
      getScanCounts(supabase, id),
      getReviews(supabase, id),
      getFeedback(supabase, id),
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
    const conversionRate = scanCounts.total > 0 ? googleRedirects / scanCounts.total : 0

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const reviewsThisMonth = reviews.filter((r) => r.created_at >= startOfMonth).length

    const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: allRatings.filter((rating) => rating === r).length,
    }))

    return NextResponse.json({
      data: {
        total_scans: scanCounts.total,
        total_scans_today: scanCounts.today,
        average_rating: averageRating,
        conversion_rate: conversionRate,
        reviews_this_month: reviewsThisMonth,
        rating_distribution: ratingDistribution,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/businesses/[id]/analytics]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
