import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import TopNav from '@/components/shared/TopNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser()

  if (!auth) redirect('/login?redirectTo=/admin')
  if (auth.profile.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="min-h-screen dashboard-bg flex flex-col">
      <TopNav
        email={auth.user.email ?? ''}
        fullName={auth.profile.full_name}
        role={auth.profile.role}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 animate-fade-in-up">
        {children}
      </main>
    </div>
  )
}
