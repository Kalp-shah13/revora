/**
 * GET /api/admin/owners
 * Returns all users with role = business_owner for the Create Business modal.
 * Super admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function GET(_request: NextRequest) {
  const check = await requireRole('super_admin')
  if (!check.authorized) return check.response

  try {
    const supabase = createServiceRoleClient()

    // Join profiles with auth.users to get email
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'business_owner')
      .order('created_at', { ascending: true })

    if (error) throw error

    type ProfileRow = { id: string; full_name: string | null; role: string }
    const profiles = (data ?? []) as unknown as ProfileRow[]

    // Get emails from auth.users via service role
    const owners = await Promise.all(
      profiles.map(async (profile) => {
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
        return {
          id: profile.id,
          email: userData?.user?.email ?? profile.id,
          full_name: profile.full_name,
        }
      })
    )

    return NextResponse.json({ data: owners })
  } catch (error) {
    console.error('[GET /api/admin/owners]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
