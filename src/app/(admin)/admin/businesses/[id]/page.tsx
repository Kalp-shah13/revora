import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import BusinessDetailPage from '@/components/admin/BusinessDetailPage'
import type { BusinessRow } from '@/components/admin/BusinessTable'

type AdminBusinessRecord = {
  id: string
  name: string
  slug: string
  google_review_link?: string
  logo_url?: string | null
  accent_color?: string
  plan: string
  is_active: boolean
  created_at: string
}

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000/api/v1';

export default async function AdminBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    const headers: Record<string, string> = token
      ? {
          Cookie: `access_token=${token}`,
          Authorization: `Bearer ${token}`,
        }
      : {}

    const res = await fetch(`${BACKEND_URL}/admin/businesses/${id}`, {
      headers,
      cache: 'no-store',
    })

    if (!res.ok) notFound()

    const json = await res.json()
    const row = json?.data as AdminBusinessRecord

    if (!row) notFound()

    const business: BusinessRow = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      google_review_link: row.google_review_link,
      logo_url: row.logo_url,
      accent_color: row.accent_color,
      plan: row.plan,
      is_active: row.is_active,
      created_at: row.created_at,
    }

    return <BusinessDetailPage business={business} />
  } catch (error) {
    console.error('[AdminBusinessPage] Error fetching business:', error)
    notFound()
  }
}
