/**
 * Auth helper utilities — server-side only.
 * Reads the HTTP-only access_token cookie and verifies session with NestJS.
 */
import { cookies } from 'next/headers';
import type { UserRole, Profile } from '@/types';

export type AuthUser = {
  user: { id: string; email?: string };
  profile: Profile;
};

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000/api/v1';

/**
 * Get the currently authenticated user + their profile (with role).
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) return null;

    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        Cookie: `access_token=${token}`,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json?.data?.user) return null;

    const u = json.data.user;

    const profile: Profile = {
      id: u.id,
      full_name: u.full_name || null,
      role: (u.role || 'business_owner') as UserRole,
      created_at: u.created_at || new Date().toISOString(),
    };

    return {
      user: {
        id: u.id,
        email: u.email,
      },
      profile,
    };
  } catch (error) {
    console.error('[getAuthUser] Error verifying session with NestJS:', error);
    return null;
  }
}

type AuthorizedResult = { authorized: true; auth: AuthUser };
type UnauthorizedResult = { authorized: false; response: Response };

/**
 * Require a specific role. Returns the user+profile or a 401/403 Response.
 */
export async function requireRole(
  requiredRole: UserRole,
): Promise<AuthorizedResult | UnauthorizedResult> {
  const auth = await getAuthUser();

  if (!auth) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  if (auth.profile.role !== requiredRole) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { authorized: true, auth };
}

/**
 * Require authentication (any role). Returns the user+profile or a 401 Response.
 */
export async function requireAuth(): Promise<AuthorizedResult | UnauthorizedResult> {
  const auth = await getAuthUser();

  if (!auth) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { authorized: true, auth };
}
