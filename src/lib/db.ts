/**
 * Typed DB helpers — thin wrappers around Supabase queries.
 * All functions are server-side only.
 * Using explicit type assertions here once so the rest of the app stays clean.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Business,
  ServiceTag,
  QrScan,
  Review,
  Feedback,
  Profile,
} from '@/types'

// Re-usable Supabase client type (works with both anon and service-role)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>

// ─── Profiles ───────────────────────────────────────────────────────────────

export async function getProfileById(
  db: AnyClient,
  id: string
): Promise<Profile | null> {
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as Profile
}

// ─── Businesses ──────────────────────────────────────────────────────────────

export async function getBusinessBySlug(
  db: AnyClient,
  slug: string
): Promise<Business | null> {
  const { data, error } = await db
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error || !data) return null
  return data as Business
}

export async function getBusinessByOwnerId(
  db: AnyClient,
  ownerId: string
): Promise<Business | null> {
  const { data, error } = await db
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .single()
  if (error || !data) return null
  return data as Business
}

export async function getAllBusinesses(db: AnyClient): Promise<Business[]> {
  const { data } = await db
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Business[]
}

export async function insertBusiness(
  db: AnyClient,
  values: Omit<Business, 'id' | 'created_at'>
): Promise<Business | null> {
  const { data, error } = await db
    .from('businesses')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data as Business
}

export async function updateBusiness(
  db: AnyClient,
  id: string,
  values: Partial<Omit<Business, 'id' | 'created_at'>>
): Promise<Business | null> {
  const { data, error } = await db
    .from('businesses')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Business
}

// ─── Service Tags ─────────────────────────────────────────────────────────────

export async function getServiceTags(
  db: AnyClient,
  businessId: string
): Promise<ServiceTag[]> {
  const { data } = await db
    .from('service_tags')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })
  return (data ?? []) as ServiceTag[]
}

export async function insertServiceTag(
  db: AnyClient,
  values: Omit<ServiceTag, 'id' | 'created_at'>
): Promise<ServiceTag> {
  const { data, error } = await db
    .from('service_tags')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data as ServiceTag
}

export async function deleteServiceTag(
  db: AnyClient,
  id: string,
  businessId: string
): Promise<void> {
  const { error } = await db
    .from('service_tags')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId)
  if (error) throw error
}

// ─── QR Scans ────────────────────────────────────────────────────────────────

export async function insertQrScan(
  db: AnyClient,
  values: { business_id: string; user_agent?: string | null }
): Promise<void> {
  const { error } = await db.from('qr_scans').insert(values)
  if (error) throw error
}

export async function getScanCounts(
  db: AnyClient,
  businessId: string
): Promise<{
  total: number
  today: number
  week: number
  month: number
}> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [total, today, week, month] = await Promise.all([
    db.from('qr_scans').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    db.from('qr_scans').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('scanned_at', startOfToday),
    db.from('qr_scans').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('scanned_at', startOfWeek),
    db.from('qr_scans').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('scanned_at', startOfMonth),
  ])

  return {
    total: total.count ?? 0,
    today: today.count ?? 0,
    week: week.count ?? 0,
    month: month.count ?? 0,
  }
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function insertReview(
  db: AnyClient,
  values: Omit<Review, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await db.from('reviews').insert(values)
  if (error) throw error
}

export async function getReviews(
  db: AnyClient,
  businessId: string
): Promise<Review[]> {
  const { data } = await db
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Review[]
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export async function insertFeedback(
  db: AnyClient,
  values: Omit<Feedback, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await db.from('feedback').insert(values)
  if (error) throw error
}

export async function getFeedback(
  db: AnyClient,
  businessId: string
): Promise<Feedback[]> {
  const { data } = await db
    .from('feedback')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Feedback[]
}

export async function updateFeedbackStatus(
  db: AnyClient,
  id: string,
  businessId: string,
  status: 'open' | 'resolved'
): Promise<void> {
  const { error } = await db
    .from('feedback')
    .update({ status })
    .eq('id', id)
    .eq('business_id', businessId)
  if (error) throw error
}
