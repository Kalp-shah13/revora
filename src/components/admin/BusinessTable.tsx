'use client'

import { useState } from 'react'
import { MoreHorizontal, PowerOff, Power, ExternalLink, Loader2, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface BusinessRow {
  id: string
  name: string
  slug: string
  google_review_link?: string
  logo_url?: string | null
  accent_color?: string
  plan: string
  is_active: boolean
  created_at: string
  owner_email?: string
  scan_count?: number
}

interface BusinessTableProps {
  businesses: BusinessRow[]
  loading?: boolean
  onStatusChange: (id: string, isActive: boolean) => void
  onSelect: (business: BusinessRow) => void
}

const PLAN_STYLES: Record<string, string> = {
  free:       'dark:border-slate-600/50 dark:text-slate-300 dark:bg-slate-700/30 border-slate-200 text-slate-600 bg-slate-50',
  pro:        'dark:border-blue-500/30 dark:text-blue-300 dark:bg-blue-500/10 border-blue-200 text-blue-700 bg-blue-50',
  enterprise: 'dark:border-blue-500/30 dark:text-blue-300 dark:bg-blue-500/10 border-blue-200 text-blue-700 bg-blue-50',
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl dark:border-slate-800/50 border-slate-100 border animate-pulse">
          <div className="h-9 w-9 rounded-xl dark:bg-slate-700 bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded dark:bg-slate-700 bg-slate-100" />
            <div className="h-3 w-48 rounded dark:bg-slate-800 bg-slate-50" />
          </div>
          <div className="h-5 w-14 rounded-full dark:bg-slate-700 bg-slate-100 hidden sm:block" />
          <div className="h-5 w-12 rounded-full dark:bg-slate-700 bg-slate-100 hidden sm:block" />
          <div className="h-8 w-8 rounded-lg dark:bg-slate-700 bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function ActionsMenu({
  business,
  onToggleStatus,
  onViewDetails,
}: {
  business: BusinessRow
  onToggleStatus: () => void
  onViewDetails: () => void
}) {
  const [isPending, setIsPending] = useState(false)

  async function handleToggle() {
    setIsPending(true)
    try {
      await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !business.is_active }),
      })
      onToggleStatus()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 rounded-lg flex items-center justify-center
            dark:text-slate-400 text-slate-500
            dark:hover:bg-slate-700/60 hover:bg-slate-100
            dark:border-slate-700/40 border-slate-200 border
            transition-all duration-200 shrink-0"
          aria-label={`Actions for ${business.name}`}
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            : <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          }
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 dark:bg-slate-900 dark:border-slate-700/60"
      >
        <DropdownMenuItem
          onClick={onViewDetails}
          className="cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
        >
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(`/review/${business.slug}`, '_blank')}
          className="cursor-pointer dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
        >
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          Preview Page
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dark:border-slate-700/60" />
        <DropdownMenuItem
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            'cursor-pointer',
            business.is_active
              ? 'text-red-500 focus:text-red-500 dark:focus:bg-red-500/10 focus:bg-red-50'
              : 'text-emerald-500 focus:text-emerald-500 dark:focus:bg-emerald-500/10 focus:bg-green-50'
          )}
        >
          {business.is_active
            ? <><PowerOff className="mr-2 h-4 w-4" aria-hidden="true" />Deactivate</>
            : <><Power className="mr-2 h-4 w-4" aria-hidden="true" />Activate</>
          }
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function BusinessTable({
  businesses: initialBusinesses,
  loading,
  onStatusChange,
  onSelect,
}: BusinessTableProps) {
  const [businesses, setBusinesses] = useState(initialBusinesses)

  if (initialBusinesses !== businesses && !loading) {
    setBusinesses(initialBusinesses)
  }

  function handleToggleStatus(id: string) {
    setBusinesses((prev) =>
      prev.map((b) => b.id === id ? { ...b, is_active: !b.is_active } : b)
    )
    const biz = businesses.find((b) => b.id === id)
    if (biz) onStatusChange(id, !biz.is_active)
  }

  if (loading) return <TableSkeleton />

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-14 h-14 rounded-2xl dark:bg-slate-800 bg-slate-100 dark:border-slate-700 border-slate-200 border flex items-center justify-center mx-auto">
          <Building2 className="h-6 w-6 dark:text-slate-600 text-slate-300" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-slate-300 text-slate-600">No businesses yet</p>
          <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
            Click &quot;New Business&quot; to add your first client.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2" role="list" aria-label="Businesses">
      {businesses.map((biz, idx) => (
        <div
          key={biz.id}
          className={cn(
            'flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl border transition-all duration-200 animate-fade-in-up',
            biz.is_active
              ? 'dark:bg-slate-800/40 dark:border-slate-700/40 dark:hover:bg-slate-800/70 dark:hover:border-slate-600/50 bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              : 'dark:bg-slate-900/30 dark:border-slate-800/40 bg-slate-50 border-slate-100 opacity-60'
          )}
          role="listitem"
          style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
        >
          {/* Icon */}
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
            biz.is_active
              ? 'dark:bg-blue-500/15 dark:border-blue-500/20 bg-blue-50 border-blue-100'
              : 'dark:bg-slate-800 dark:border-slate-700 bg-slate-100 border-slate-200'
          )}>
            <Building2 className={cn(
              'h-4 w-4',
              biz.is_active ? 'dark:text-blue-400 text-blue-500' : 'dark:text-slate-500 text-slate-400'
            )} aria-hidden="true" />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => onSelect(biz)}
              className="text-sm font-semibold dark:text-white text-slate-900
                dark:hover:text-blue-400 hover:text-blue-600
                transition-colors text-left truncate w-full focus:outline-none"
            >
              {biz.name}
            </button>
            <p className="text-xs dark:text-slate-500 text-slate-400 truncate font-mono">
              /review/{biz.slug}
              {biz.owner_email && (
                <span className="ml-2 font-sans dark:text-slate-600 text-slate-300">
                  · {biz.owner_email}
                </span>
              )}
            </p>
          </div>

          {/* Scan count */}
          <span className="text-xs dark:text-slate-500 text-slate-400 tabular-nums hidden md:block shrink-0">
            {biz.scan_count ?? 0} scans
          </span>

          {/* Plan badge */}
          <Badge
            variant="outline"
            className={cn('text-xs shrink-0 hidden sm:flex capitalize', PLAN_STYLES[biz.plan] ?? PLAN_STYLES.free)}
          >
            {biz.plan}
          </Badge>

          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn(
              'text-xs shrink-0',
              biz.is_active
                ? 'dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 border-green-200 text-green-700 bg-green-50'
                : 'dark:border-slate-700 dark:text-slate-500 border-slate-200 text-slate-400 bg-slate-50'
            )}
          >
            <span className={cn(
              'w-1 h-1 rounded-full mr-1.5',
              biz.is_active ? 'dark:bg-emerald-400 bg-green-500' : 'dark:bg-slate-600 bg-slate-400'
            )} aria-hidden="true" />
            {biz.is_active ? 'Active' : 'Inactive'}
          </Badge>

          {/* Actions */}
          <ActionsMenu
            business={biz}
            onToggleStatus={() => handleToggleStatus(biz.id)}
            onViewDetails={() => onSelect(biz)}
          />
        </div>
      ))}
    </div>
  )
}
