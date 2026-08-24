/**
 * GET /api/dashboard/qr
 * Authenticated — business owner only.
 * Returns QR code as PNG (base64) and SVG for the owner's business.
 */
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBusinessByOwnerId } from '@/lib/db'
import { getReviewPageUrl } from '@/lib/utils'

export async function GET(_request: NextRequest) {
  const check = await requireRole('business_owner')
  if (!check.authorized) return check.response

  try {
    const supabase = await createServerSupabaseClient()
    const business = await getBusinessByOwnerId(supabase, check.auth.profile.id)

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const reviewUrl = getReviewPageUrl(business.slug)

    // Generate PNG as base64 data URL
    const pngDataUrl = await QRCode.toDataURL(reviewUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0F172A',  // slate-900
        light: '#FFFFFF',
      },
    })

    // Generate SVG string
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
    console.error('[GET /api/dashboard/qr]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
