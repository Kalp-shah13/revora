import { notFound } from 'next/navigation'
import BusinessDetailPage from '@/components/admin/BusinessDetailPage'
import { createServiceRoleClient } from '@/lib/supabase/service'
import type { BusinessRow } from '@/components/admin/BusinessTable'

type AdminBusinessRecord = {
  id: string
  name: string
  slug: string
  plan: string
  is_active: boolean
  created_at: string
}

export default async function AdminBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('businesses')
    .select('id, name, slug, plan, is_active, created_at')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const row = data as unknown as AdminBusinessRecord

  const business: BusinessRow = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    is_active: row.is_active,
    created_at: row.created_at,
  }

  return <BusinessDetailPage business={business} />
}
