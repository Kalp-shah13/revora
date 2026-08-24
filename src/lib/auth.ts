/**
 * Auth helper utilities — server-side only.
 * Use in API routes and Server Components to verify session and role.
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserRole, Profile } from '@/types'

export type AuthUser = {
  user: { id: string; email?: string }
  profile: Profile
}

/**
 * Get the currently authenticated user + their profile (with role).
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profileRow) return null

  // Cast to Profile — the shape matches the DB row exactly
  const profile = profileRow as unknown as Profile

  return { user, profile }
}

type AuthorizedResult = { authorized: true; auth: AuthUser }
type UnauthorizedResult = { authorized: false; response: Response }

/**
 * Require a specific role. Returns the user+profile or a 401/403 Response.
 * Use this inside API route handlers.
 */
export async function requireRole(
  requiredRole: UserRole
): Promise<AuthorizedResult | UnauthorizedResult> {
  const auth = await getAuthUser()

  if (!auth) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }

  if (auth.profile.role !== requiredRole) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }

  return { authorized: true, auth }
}

/**
 * Require authentication (any role). Returns the user+profile or a 401 Response.
 */
export async function requireAuth(): Promise<AuthorizedResult | UnauthorizedResult> {
  const auth = await getAuthUser()

  if (!auth) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }

  return { authorized: true, auth }
}
