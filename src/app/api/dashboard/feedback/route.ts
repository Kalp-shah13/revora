/**
 * GET   /api/dashboard/feedback — list private feedback for own business
 * PATCH /api/dashboard/feedback — update status (open → resolved)
 * Authenticated, business owner only (RLS enforced).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBusinessByOwnerId, getFeedback, updateFeedbackStatus } from '@/lib/db'

export async function GET(_request: NextRequest) {
  const check = await requireRole('business_owner')
  if (!check.authorized) return check.response

  try {
    const supabase = await createServerSupabaseClient()

    const business = await getBusinessByOwnerId(supabase, check.auth.profile.id)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const data = await getFeedback(supabase, business.id)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/dashboard/feedback]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const check = await requireRole('business_owner')
  if (!check.authorized) return check.response

  try {
    const { id, status } = await request.json()

    if (!id || !status || !['open', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'id and valid status (open|resolved) are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const business = await getBusinessByOwnerId(supabase, check.auth.profile.id)
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    await updateFeedbackStatus(supabase, id, business.id, status)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('[PATCH /api/dashboard/feedback]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
