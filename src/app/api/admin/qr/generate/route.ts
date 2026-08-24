/**
 * POST /api/admin/qr/generate
 * Super admin only — generate QR code for any business by ID.
 * Uses service-role client.
 */
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { requireRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getReviewPageUrl } from '@/lib/utils'
import type { Business } from '@/types'

export async function POST(request: NextRequest) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const { business_id } = await request.json()

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: businessRow, error } = await supabase
      .from('businesses')
      .select('slug, accent_color')
      .eq('id', business_id)
      .single()

    if (error || !businessRow) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const business = businessRow as unknown as Pick<Business, 'slug' | 'accent_color'>
    const reviewUrl = getReviewPageUrl(business.slug)

    const pngDataUrl = await QRCode.toDataURL(reviewUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })

    const svgString = await QRCode.toString(reviewUrl, {
      type: 'svg',
      margin: 2,
    })

    return NextResponse.json({
      data: {
        review_url: reviewUrl,
        png_data_url: pngDataUrl,
        svg: svgString,
      },
    })
  } catch (error) {
    console.error('[POST /api/admin/qr/generate]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
