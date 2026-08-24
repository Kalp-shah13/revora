/**
 * GET /api/admin/businesses/[id]/tags
 * Returns service tags for a specific business. Super admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { getServiceTags } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const { id } = await params
    const supabase = createServiceRoleClient()
    const tags = await getServiceTags(supabase, id)
    return NextResponse.json({ data: tags })
  } catch (error) {
    console.error('[GET /api/admin/businesses/[id]/tags]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
