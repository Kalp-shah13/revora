'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, QrCode, Star, TrendingUp, RefreshCw } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { formatPercent } from '@/lib/utils'

interface PlatformData {
  total_businesses: number
  active_businesses: number
  total_scans: number
  total_reviews: number
  total_feedback: number
  platform_conversion_rate: number
}

export default function PlatformStats() {
  const [data,          setData]          = useState<PlatformData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [refreshing,    setRefreshing]    = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) return
      const json = await res.json()
      if (json.data) { setData(json.data); setLastRefreshed(new Date()) }
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useAutoRefresh(fetchStats, 30_000)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-3 rounded-full bg-blue-500" />
            <div className="w-1 h-1.5 rounded-full bg-blue-500/40" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold dark:text-white text-slate-900">
            Platform Overview
          </h2>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchStats() }}
          disabled={refreshing}
          className="group flex items-center gap-1.5 text-xs dark:text-slate-500 text-slate-400
            hover:dark:text-slate-200 hover:text-slate-700
            transition-all duration-200 px-2.5 py-1.5 rounded-lg
            dark:hover:bg-slate-800/60 hover:bg-slate-100
            border border-transparent dark:hover:border-slate-700/50 hover:border-slate-200"
          aria-label="Refresh platform stats"
        >
          <RefreshCw
            className={`h-3 w-3 transition-all duration-300 ${
              refreshing
                ? 'animate-spin text-blue-500'
                : 'group-hover:rotate-180'
            }`}
            aria-hidden="true"
          />
          <span className="hidden sm:block">
            {lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </button>
      </div>

      {/* Stat cards — staggered entrance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          {
            title: 'Total Businesses',
            value: loading ? '—' : (data?.total_businesses ?? 0),
            subtitle: `${data?.active_businesses ?? 0} active`,
            icon: Building2,
            iconColor: 'text-blue-500 dark:text-blue-400',
            iconBg: 'bg-blue-600/10',
            borderColor: 'hover:border-blue-600/30',
            glowColor: 'hover:shadow-blue-600/15',
            delay: 0,
          },
          {
            title: 'Total Scans',
            value: loading ? '—' : (data?.total_scans ?? 0),
            subtitle: 'all time',
            icon: QrCode,
            iconColor: 'text-blue-500 dark:text-blue-400',
            iconBg: 'bg-blue-600/10',
            borderColor: 'hover:border-blue-600/30',
            glowColor: 'hover:shadow-blue-600/15',
            delay: 60,
          },
          {
            title: 'Reviews Posted',
            value: loading ? '—' : (data?.total_reviews ?? 0),
            subtitle: 'Google redirects',
            icon: Star,
            iconColor: 'text-amber-400',
            iconBg: 'bg-amber-500/15',
            borderColor: 'hover:border-amber-500/40',
            glowColor: 'hover:shadow-amber-500/20',
            delay: 120,
          },
          {
            title: 'Conversion',
            value: loading ? '—' : formatPercent(data?.platform_conversion_rate ?? 0),
            subtitle: 'platform-wide',
            icon: TrendingUp,
            iconColor: 'text-emerald-400',
            iconBg: 'bg-emerald-500/15',
            borderColor: 'hover:border-emerald-500/40',
            glowColor: 'hover:shadow-emerald-500/20',
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
    </div>
  )
}
