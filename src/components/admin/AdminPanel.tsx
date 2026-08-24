'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, Search } from 'lucide-react'
import PlatformStats from './PlatformStats'
import BusinessTable, { type BusinessRow } from './BusinessTable'
import CreateBusinessModal from './CreateBusinessModal'
import { cn } from '@/lib/utils'

export default function AdminPanel() {
  const router = useRouter()
  const [businesses,       setBusinesses]       = useState<BusinessRow[]>([])
  const [loading,          setLoading]          = useState(true)
  const [search,           setSearch]           = useState('')
  const [showCreate,       setShowCreate]       = useState(false)

  const fetchBusinesses = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/businesses')
      const data = await res.json()
      if (data.data) {
        const rows: BusinessRow[] = (data.data as Array<{
          id: string; name: string; slug: string; plan: string
          is_active: boolean; created_at: string
          profiles?: { full_name: string | null }
          scan_count?: [{ count: number }]
        }>).map((b) => ({
          id: b.id, name: b.name, slug: b.slug, plan: b.plan,
          is_active: b.is_active, created_at: b.created_at,
          owner_email: b.profiles?.full_name ?? undefined,
          scan_count: Array.isArray(b.scan_count) ? (b.scan_count[0]?.count ?? 0) : 0,
        }))
        setBusinesses(rows)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBusinesses() }, [fetchBusinesses])

  const filtered = search.trim()
    ? businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.slug.toLowerCase().includes(search.toLowerCase())
      )
    : businesses

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Platform stats */}
      <PlatformStats />

      {/* Businesses section */}
      <div
        className="dashboard-card rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ animationDelay: '200ms', animationFillMode: 'both' }}
      >
        {/* Section header */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3.5 border-b dark:border-slate-800/60 border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">B</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold dark:text-white text-slate-900">
                Businesses
                {!loading && (
                  <span className="ml-2 text-xs font-normal dark:text-slate-500 text-slate-400">
                    ({businesses.length})
                  </span>
                )}
              </h2>
              <p className="text-xs dark:text-slate-500 text-slate-400">Manage all client businesses</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoading(true); fetchBusinesses() }}
              className="group h-9 w-9 rounded-xl border dark:border-slate-700/50 border-slate-200
                flex items-center justify-center
                dark:hover:bg-slate-800 hover:bg-slate-50
                dark:text-slate-400 text-slate-500
                transition-all duration-200"
              aria-label="Refresh businesses"
            >
              <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-300" aria-hidden="true" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className={cn(
                'h-9 px-4 rounded-xl font-semibold text-sm btn-primary-solid flex items-center gap-1.5',
                'transition-all duration-200 active:scale-95'
              )}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">New Business</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 sm:px-5 py-3 border-b dark:border-slate-800/40 border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-slate-500 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search businesses"
              className={cn(
                'w-full h-9 pl-9 pr-4 rounded-xl text-sm',
                'border dark:border-slate-700/50 border-slate-200',
                'dark:bg-slate-900/50 bg-white',
                'dark:text-white text-slate-900',
                'dark:placeholder:text-slate-500 placeholder:text-slate-400',
                'outline-none focus:ring-2 dark:focus:ring-blue-500/30 focus:ring-blue-500/20',
                'dark:focus:border-blue-500/50 focus:border-blue-400',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-4 sm:px-5 py-4">
          <BusinessTable
            businesses={filtered}
            loading={loading}
            onStatusChange={(id, isActive) => {
              setBusinesses((prev) =>
                prev.map((b) => b.id === id ? { ...b, is_active: isActive } : b)
              )
            }}
            onSelect={(business) => router.push(`/admin/businesses/${business.id}`)}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateBusinessModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchBusinesses}
      />
    </div>
  )
}
