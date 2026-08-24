/**
 * GET    /api/dashboard/tags — list service tags for own business
 * POST   /api/dashboard/tags — add a new service tag
 * DELETE /api/dashboard/tags — remove a service tag by id
 * Authenticated, business owner only (RLS enforced).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getBusinessByOwnerId,
  getServiceTags,
  insertServiceTag,
  deleteServiceTag,
} from '@/lib/db'
import { sanitizeForPrompt } from '@/lib/utils'

export async function GET(_request: NextRequest) {
  const check = await requireRole('business_owner')
  if (!check.authorized) return check.response

  try {
    const supabase = await createServerSupabaseClient()
    const business = await getBusinessByOwnerId(supabase, check.auth.profile.id)
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const data = await getServiceTags(supabase, business.id)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/dashboard/tags]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const check = await requireRole('business_owner')
  if (!check.authorized) return check.response

  try {
    const { label } = await request.json()

    if (!label || typeof label !== 'string') {
      return NextResponse.json({ error: 'label is required' }, { status: 400 })
    }

    const safeLabel = sanitizeForPrompt(label.trim(), 50)
    if (!safeLabel) {
      return NextResponse.json({ error: 'Invalid tag label' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const business = await getBusinessByOwnerId(supabase, check.auth.profile.id)
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const data = await insertServiceTag(supabase, {
      business_id: business.id,
      label: safeLabel,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/dashboard/tags]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const check = await requireRole('business_owner')
  if (!check.authorized) return check.response

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Tag id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const business = await getBusinessByOwnerId(supabase, check.auth.profile.id)
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    await deleteServiceTag(supabase, id, business.id)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('[DELETE /api/dashboard/tags]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
