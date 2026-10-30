/**
 * Typed Data helpers for Next.js Server Components.
 * Fetches data from the standalone NestJS backend.
 */
import { cookies } from 'next/headers';
import type {
  Business,
  ServiceTag,
  Feedback,
} from '@/types';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000/api/v1';

/**
 * Helper to extract the access_token from incoming request cookies
 * so Server Components can call authenticated backend APIs.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      return {
        Cookie: `access_token=${token}`,
        Authorization: `Bearer ${token}`,
      };
    }
  } catch {
    // In contexts where cookies() is not available (e.g. static generation)
  }
  return {};
}

// ─── Businesses ──────────────────────────────────────────────────────────────

export async function getBusinessBySlug(
  _client: any,
  slug: string,
): Promise<Business | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/business/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data?.business as Business) ?? null;
  } catch (error) {
    console.error('[getBusinessBySlug] Error fetching from NestJS:', error);
    return null;
  }
}

export async function getServiceTags(
  _client: any,
  businessId: string,
): Promise<ServiceTag[]> {
  try {
    const headers = await getAuthHeaders();
    // 1. Try public tag endpoint
    const res = await fetch(`${BACKEND_URL}/tags/business/${businessId}`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      return (json?.data as ServiceTag[]) ?? [];
    }

    // 2. Fallback to admin tag endpoint
    const adminRes = await fetch(`${BACKEND_URL}/admin/businesses/${businessId}/tags`, {
      headers,
      cache: 'no-store',
    });
    if (adminRes.ok) {
      const json = await adminRes.json();
      return (json?.data as ServiceTag[]) ?? [];
    }

    return [];
  } catch (error) {
    console.error('[getServiceTags] Error fetching from NestJS:', error);
    return [];
  }
}

export async function getBusinessByOwnerId(
  _client: any,
  ownerId: string,
  businessId?: string,
): Promise<Business | null> {
  try {
    const headers = await getAuthHeaders();
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';

    // 1. Query business directly by ownerId
    const res = await fetch(`${BACKEND_URL}/business/by-owner/${ownerId}${query}`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data as Business;
    }

    // 2. Query business for currently authenticated user session
    const mineRes = await fetch(`${BACKEND_URL}/business/mine${query}`, {
      headers,
      cache: 'no-store',
    });
    if (mineRes.ok) {
      const json = await mineRes.json();
      if (json?.data) return json.data as Business;
    }

    // 3. Fallback for super_admin session: inspect all businesses
    const adminRes = await fetch(`${BACKEND_URL}/admin/businesses`, {
      headers,
      cache: 'no-store',
    });
    if (adminRes.ok) {
      const json = await adminRes.json();
      const list = (json?.data as Business[]) ?? [];
      if (businessId) {
        return list.find((b: any) => b.id === businessId) ?? null;
      }
      return list.find((b: any) => b.owner_id === ownerId || b.id === ownerId) ?? null;
    }

    return null;
  } catch (error) {
    console.error('[getBusinessByOwnerId] Error fetching from NestJS:', error);
    return null;
  }
}

export async function getBusinessesByOwnerId(
  _client: any,
  ownerId?: string,
): Promise<Business[]> {
  try {
    const headers = await getAuthHeaders();

    // 1. Query all businesses owned by this session
    const res = await fetch(`${BACKEND_URL}/business/my-list`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        return json.data as Business[];
      }
    }

    // 2. Fallback to admin businesses endpoint
    const adminRes = await fetch(`${BACKEND_URL}/admin/businesses`, {
      headers,
      cache: 'no-store',
    });
    if (adminRes.ok) {
      const json = await adminRes.json();
      const list = (json?.data as Business[]) ?? [];
      if (ownerId) {
        return list.filter((b: any) => b.owner_id === ownerId || b.id === ownerId);
      }
      return list;
    }

    return [];
  } catch (error) {
    console.error('[getBusinessesByOwnerId] Error fetching from NestJS:', error);
    return [];
  }
}

export async function getFeedback(
  _client: any,
  businessId: string,
): Promise<Feedback[]> {
  try {
    const headers = await getAuthHeaders();

    // 1. Try by-business endpoint
    const res = await fetch(`${BACKEND_URL}/dashboard/feedback/by-business/${businessId}`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      return (json?.data as Feedback[]) ?? [];
    }

    // 2. Try owner dashboard feedback endpoint
    const ownerRes = await fetch(`${BACKEND_URL}/dashboard/feedback`, {
      headers,
      cache: 'no-store',
    });
    if (ownerRes.ok) {
      const json = await ownerRes.json();
      return (json?.data as Feedback[]) ?? [];
    }

    return [];
  } catch (error) {
    console.error('[getFeedback] Error fetching from NestJS:', error);
    return [];
  }
}
