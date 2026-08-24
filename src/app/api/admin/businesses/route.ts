/**
 * GET  /api/admin/businesses — list all businesses
 * POST /api/admin/businesses — create a new business
 * Super admin only — uses service-role client (bypasses RLS).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getAllBusinesses, insertBusiness } from '@/lib/db'
import { generateSlug } from '@/lib/utils'

export async function GET(_request: NextRequest) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const supabase = createServiceRoleClient()
    const businesses = await getAllBusinesses(supabase)
    return NextResponse.json({ data: businesses })
  } catch (error) {
    console.error('[GET /api/admin/businesses]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const body = await request.json()
    const { name, slug: customSlug, google_review_link, owner_id, plan, logo_url, accent_color } =
      body

    if (!name || !google_review_link || !owner_id) {
      return NextResponse.json(
        { error: 'name, google_review_link, and owner_id are required' },
        { status: 400 }
      )
    }

    const slug = customSlug?.trim() || generateSlug(name)
    const supabase = createServiceRoleClient()

    const data = await insertBusiness(supabase, {
      name: name.trim(),
      slug,
      google_review_link: google_review_link.trim(),
      owner_id,
      plan: plan ?? 'free',
      logo_url: logo_url ?? null,
      accent_color: accent_color ?? '#D97706',
      is_active: true,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: unknown) {
    const pgError = error as { code?: string }
    if (pgError?.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    console.error('[POST /api/admin/businesses]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
