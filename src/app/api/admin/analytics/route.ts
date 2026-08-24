/**
 * GET /api/admin/analytics
 * Super admin only — platform-wide aggregate analytics across all businesses.
 * Uses service-role client.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function GET(_request: NextRequest) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const supabase = createServiceRoleClient()

    const [
      totalBusinesses,
      activeBusinesses,
      totalScans,
      totalReviews,
      totalFeedback,
      googleRedirects,
    ] = await Promise.all([
      supabase.from('businesses').select('id', { count: 'exact', head: true }),
      supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('qr_scans').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
      supabase.from('feedback').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('redirected_to_google', true),
    ])

    const totalScansCount = totalScans.count ?? 0
    const platformConversionRate =
      totalScansCount > 0 ? (googleRedirects.count ?? 0) / totalScansCount : 0

    return NextResponse.json({
      data: {
        total_businesses: totalBusinesses.count ?? 0,
        active_businesses: activeBusinesses.count ?? 0,
        total_scans: totalScansCount,
        total_reviews: totalReviews.count ?? 0,
        total_feedback: totalFeedback.count ?? 0,
        platform_conversion_rate: platformConversionRate,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/analytics]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
