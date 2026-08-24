import { getAuthUser } from '@/lib/auth'
import { ShieldCheck } from 'lucide-react'
import AdminPanel from '@/components/admin/AdminPanel'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

export default async function AdminPage() {
  const auth = await getAuthUser()
  const displayName = auth?.profile.full_name || auth?.user.email?.split('@')[0] || 'Admin'

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-purple-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900 truncate">
              Admin Panel
            </h1>
            <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-500">
              Welcome, {displayName}
            </p>
          </div>
        </div>
        {/* Super Admin badge */}
        <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-medium text-purple-400 hidden sm:block">Super Admin</span>
        </div>
      </div>

      <ErrorBoundary>
        <AdminPanel />
      </ErrorBoundary>
    </div>
  )
}
