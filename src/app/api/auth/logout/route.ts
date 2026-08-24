/**
 * POST /api/auth/logout
 * Signs the user out server-side and clears the session cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/login', _request.url), { status: 302 })
}
