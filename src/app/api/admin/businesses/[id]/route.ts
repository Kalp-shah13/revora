/**
 * PUT    /api/admin/businesses/[id] — update a business
 * DELETE /api/admin/businesses/[id] — deactivate a business (soft delete)
 * Super admin only — uses service-role client.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { updateBusiness } from '@/lib/db'
import type { Business } from '@/types'

const ALLOWED_UPDATE_FIELDS: Array<keyof Omit<Business, 'id' | 'created_at'>> = [
  'name',
  'slug',
  'google_review_link',
  'logo_url',
  'accent_color',
  'plan',
  'is_active',
]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const { id } = await params
    const body = await request.json()

    // Only allow safe fields to be updated
    const updates: Partial<Omit<Business, 'id' | 'created_at'>> = {}
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const data = await updateBusiness(supabase, id, updates)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PUT /api/admin/businesses/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const { id } = await params
    const supabase = createServiceRoleClient()

    // Soft-delete: set is_active = false rather than deleting the record
    await updateBusiness(supabase, id, { is_active: false })

    return NextResponse.json({ data: { success: true, message: 'Business deactivated' } })
  } catch (error) {
    console.error('[DELETE /api/admin/businesses/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
