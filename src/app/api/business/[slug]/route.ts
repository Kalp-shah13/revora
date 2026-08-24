/**
 * GET /api/business/[slug]
 * Public — fetch business info + service tags for the review page.
 * Uses anon key (RLS enforced). Only returns active businesses.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBusinessBySlug, getServiceTags } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()

    const business = await getBusinessBySlug(supabase, slug)

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found or inactive' },
        { status: 404 }
      )
    }

    const tags = await getServiceTags(supabase, business.id)

    // Only expose non-sensitive fields to the public
    const publicBusiness = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      logo_url: business.logo_url,
      accent_color: business.accent_color,
      google_review_link: business.google_review_link,
    }

    return NextResponse.json({ data: { business: publicBusiness, tags } })
  } catch (error) {
    console.error('[GET /api/business/[slug]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
