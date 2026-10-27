import { Suspense } from 'react'
import { getAuthUser } from '@/lib/auth'
import { getBusinessByOwnerId, getBusinessesByOwnerId, getFeedback, getServiceTags } from '@/lib/db'
import AnalyticsSection from '@/components/dashboard/AnalyticsSection'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import BranchSwitcher from '@/components/dashboard/BranchSwitcher'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import { AlertCircle, Building2 } from 'lucide-react'

interface DashboardPageProps {
  searchParams: Promise<{ businessId?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams
  const selectedBusinessId = resolvedSearchParams?.businessId

  const auth = await getAuthUser()
  const displayName =
    auth?.profile.full_name || auth?.user.email?.split('@')[0] || 'there'

  // Fetch all businesses owned by this account
  const allBusinesses = auth
    ? await getBusinessesByOwnerId(null, auth.profile.id)
    : []

  // Resolve the active business (either matching requested businessId, or the first/primary business)
  let business = null
  if (auth) {
    if (selectedBusinessId) {
      business =
        allBusinesses.find((b) => b.id === selectedBusinessId) ||
        (await getBusinessByOwnerId(null, auth.profile.id, selectedBusinessId))
    }
    if (!business) {
      business =
        allBusinesses[0] || (await getBusinessByOwnerId(null, auth.profile.id))
    }
  }

  if (!business) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-slate-400">Welcome back, {displayName}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-amber-300">No business set up yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Ask your administrator to create a business and assign it to your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const [feedback, tags] = await Promise.all([
    getFeedback(null, business.id),
    getServiceTags(null, business.id),
  ])

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header with BranchSwitcher */}
      <div className="flex items-center justify-between gap-3">
        <BranchSwitcher
          currentBusiness={business}
          businesses={allBusinesses.length > 0 ? allBusinesses : [business]}
        />
        {/* Live badge */}
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-green-400 hidden sm:block">Live</span>
        </div>
      </div>

      {/* Analytics */}
      <ErrorBoundary>
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsSection businessId={business.id} />
        </Suspense>
      </ErrorBoundary>

      {/* Tabs */}
      <ErrorBoundary>
        <DashboardTabs
          feedback={feedback}
          tags={tags}
          openCount={feedback.filter((f) => f.status === 'open').length}
          businessId={business.id}
        />
      </ErrorBoundary>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-24 rounded-lg bg-slate-800 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-slate-800 animate-pulse" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-slate-800 animate-pulse" />
    </div>
  )
}
