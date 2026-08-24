import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'

/**
 * Root page — immediately redirect based on auth state + role.
 * - Not authenticated  → /login
 * - super_admin        → /admin
 * - business_owner     → /dashboard
 */
export default async function HomePage() {
  const auth = await getAuthUser()

  if (!auth) redirect('/login')
  if (auth.profile.role === 'super_admin') redirect('/admin')
  redirect('/dashboard')
}
