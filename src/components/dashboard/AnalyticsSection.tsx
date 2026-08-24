'use client'

import { useState, useEffect, useCallback } from 'react'
import { QrCode, Star, TrendingUp, CalendarDays, RefreshCw } from 'lucide-react'
import StatCard from './StatCard'
import RatingChart from './RatingChart'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { formatPercent, formatRating } from '@/lib/utils'
import type { AnalyticsData } from '@/types'

export default function AnalyticsSection() {
  const [data,         setData]         = useState<AnalyticsData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [lastRefreshed,setLastRefreshed]= useState<Date>(new Date())
  const [refreshing,   setRefreshing]   = useState(false)

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/analytics')
      if (!res.ok) return
      const json = await res.json()
      if (json.data) { setData(json.data); setLastRefreshed(new Date()) }
    } catch { /* ignore */ }
    finally    { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
  useAutoRefresh(fetchAnalytics, 30_000)

  const avgRating = data ? formatRating(data.average_rating) : '—'
  const convRate  = data ? formatPercent(data.conversion_rate) : '—'

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Animated accent bar */}
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-3 rounded-full bg-blue-400" />
            <div className="w-1 h-1.5 rounded-full bg-blue-400/40" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-white">Overview</h2>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchAnalytics() }}
          disabled={refreshing}
          className="group flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-all duration-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50"
          aria-label="Refresh analytics"
        >
          <RefreshCw
            className={`h-3 w-3 transition-all duration-300 ${refreshing ? 'animate-spin text-blue-400' : 'group-hover:rotate-180'}`}
            aria-hidden="true"
          />
          <span className="hidden sm:block">
            {lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </button>
      </div>

      {/* Stat cards — staggered entrance via inline style delay */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          {
            title: 'Total Scans',
            value: loading ? '—' : (data?.total_scans ?? 0),
            subtitle: `${data?.total_scans_today ?? 0} today`,
            icon: QrCode,
            iconColor: 'text-blue-400',
            iconBg: 'bg-blue-500/15',
            borderColor: 'hover:border-blue-500/40',
            glowColor: 'hover:shadow-blue-500/20',
            delay: 0,
          },
          {
            title: 'Avg Rating',
            value: loading ? '—' : avgRating,
            subtitle: 'out of 5 stars',
            icon: Star,
            iconColor: 'text-amber-400',
            iconBg: 'bg-amber-500/15',
            borderColor: 'hover:border-amber-500/40',
            glowColor: 'hover:shadow-amber-500/20',
            delay: 60,
          },
          {
            title: 'Conversion',
            value: loading ? '—' : convRate,
            subtitle: 'scans → Google',
            icon: TrendingUp,
            iconColor: 'text-emerald-400',
            iconBg: 'bg-emerald-500/15',
            borderColor: 'hover:border-emerald-500/40',
            glowColor: 'hover:shadow-emerald-500/20',
            delay: 120,
          },
          {
            title: 'This Month',
            value: loading ? '—' : (data?.reviews_this_month ?? 0),
            subtitle: 'reviews posted',
            icon: CalendarDays,
            iconColor: 'text-purple-400',
            iconBg: 'bg-purple-500/15',
            borderColor: 'hover:border-purple-500/40',
            glowColor: 'hover:shadow-purple-500/20',
            delay: 180,
          },
        ].map((card) => (
          <div
            key={card.title}
            className="animate-fade-in-up"
            style={{ animationDelay: `${card.delay}ms`, animationFillMode: 'both' }}
          >
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              iconColor={card.iconColor}
              iconBg={card.iconBg}
              borderColor={card.borderColor}
              glowColor={card.glowColor}
              loading={loading}
            />
          </div>
        ))}
      </div>

      {/* Rating chart card */}
      <div className="dashboard-card rounded-2xl border border-slate-800/50 overflow-hidden animate-fade-in-up" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Rating Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Breakdown of all ratings received</p>
          </div>
          {data && (
            <div className="text-right">
              <p className="text-lg font-bold text-white">{data.total_scans}</p>
              <p className="text-xs text-slate-500">total</p>
            </div>
          )}
        </div>
        <div className="px-4 sm:px-5 py-4 sm:py-5">
          <RatingChart data={data?.rating_distribution ?? []} loading={loading} />
        </div>
      </div>

    </div>
  )
}
