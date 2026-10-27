'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ArrowLeft, ExternalLink, QrCode, Tag, BarChart2, Loader2, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import RatingChart from '@/components/dashboard/RatingChart'
import { formatPercent, formatRating } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { BusinessRow } from './BusinessTable'

interface AnalyticsData {
  total_scans: number
  total_scans_today: number
  average_rating: number
  conversion_rate: number
  reviews_this_month: number
  rating_distribution: { rating: number; count: number }[]
}

type DetailTab = 'analytics' | 'tags' | 'qr'

const TABS: { id: DetailTab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'tags',      label: 'Tags',      icon: Tag       },
  { id: 'qr',        label: 'QR Code',   icon: QrCode    },
]

export default function BusinessDetailPage({ business }: { business: BusinessRow }) {
  const [activeTab,        setActiveTab]        = useState<DetailTab>('analytics')
  const [analytics,        setAnalytics]        = useState<AnalyticsData | null>(null)
  const [tags,             setTags]             = useState<{ id: string; label: string }[]>([])
  const [qrPng,            setQrPng]            = useState<string | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingQr,        setLoadingQr]        = useState(false)

  useEffect(() => {
    setLoadingAnalytics(true)
    fetch(`/api/admin/businesses/${business.id}/analytics`)
      .then(r => r.json())
      .then(d => { if (d.data) setAnalytics(d.data) })
      .catch(() => {})
      .finally(() => setLoadingAnalytics(false))

    fetch(`/api/admin/businesses/${business.id}/tags`)
      .then(r => r.json())
      .then(d => setTags(d.data ?? []))
      .catch(() => {})

    setLoadingQr(true)
    fetch('/api/admin/qr/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: business.id }),
    })
      .then(r => r.json())
      .then(d => { if (d.data?.png_data_url) setQrPng(d.data.png_data_url) })
      .catch(() => {})
      .finally(() => setLoadingQr(false))
  }, [business.id])

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to businesses
          </Link>
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border dark:border-slate-700 border-slate-200">
                <Image src={business.logo_url} alt="" width={44} height={44} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-blue-400 text-sm font-bold uppercase">{business.name[0]}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold dark:text-white text-slate-900 truncate">
                {business.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs sm:text-sm dark:text-slate-500 text-slate-400 font-mono">
                  /review/{business.slug}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs rounded-full',
                    business.is_active
                      ? 'dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 border-green-200 text-green-700 bg-green-50'
                      : 'dark:border-slate-700 dark:text-slate-500 border-slate-200 text-slate-500'
                  )}
                >
                  {business.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs capitalize dark:border-slate-700 dark:text-slate-400 rounded-full"
                >
                  {business.plan}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {business.google_review_link && (
            <button
              onClick={() => window.open(business.google_review_link, '_blank', 'noopener,noreferrer')}
              className="h-10 px-4 rounded-xl text-sm font-medium flex items-center gap-2
                bg-blue-600/10 border border-blue-500/30 text-blue-400
                hover:bg-blue-600/20 hover:text-blue-300
                transition-all duration-200"
              aria-label="Test Google Review Link"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Google Link
            </button>
          )}

          <button
            onClick={() => window.open(`/review/${business.slug}`, '_blank')}
            className="h-10 px-4 rounded-xl text-sm font-medium flex items-center gap-2
              dark:border-slate-700/50 border-slate-200 border
              dark:text-slate-300 text-slate-600
              dark:hover:bg-slate-800 hover:bg-slate-50
              transition-all duration-200"
            aria-label="Preview review page"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      <div className="dashboard-card rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-0">
          <div className="flex gap-0.5 p-1 rounded-xl dark:bg-slate-900/60 bg-slate-100 border dark:border-slate-800/50 border-slate-200/80 max-w-2xl">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'dark:bg-slate-800 bg-white dark:text-white text-slate-900 dark:shadow-sm shadow-sm dark:border-slate-700/40 border border-slate-200/80'
                      : 'dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div key={activeTab} className="px-4 sm:px-5 py-5 animate-fade-in-up">
          {activeTab === 'analytics' && (
            loadingAnalytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-24 rounded-xl dark:bg-slate-800 bg-slate-100 animate-pulse" />
                  ))}
                </div>
                <div className="h-56 rounded-xl dark:bg-slate-800 bg-slate-100 animate-pulse" />
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Scans',  value: analytics.total_scans,                    sub: `${analytics.total_scans_today} today`, color: 'blue' },
                    { label: 'Avg Rating',   value: formatRating(analytics.average_rating),   sub: 'out of 5 stars',                      color: 'amber' },
                    { label: 'Conversion',   value: formatPercent(analytics.conversion_rate), sub: 'scans to Google',                     color: 'emerald' },
                    { label: 'This Month',   value: analytics.reviews_this_month,             sub: 'reviews posted',                      color: 'blue' },
                  ].map(({ label, value, sub, color }) => (
                    <div
                      key={label}
                      className="stat-card rounded-xl p-4 border dark:border-slate-700/40 border-slate-200"
                    >
                      <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
                      <p className={cn(
                        'text-2xl font-bold tabular-nums mt-1',
                        color === 'blue'    && 'dark:text-blue-300 text-blue-600',
                        color === 'amber'   && 'dark:text-amber-300 text-amber-600',
                        color === 'emerald' && 'dark:text-emerald-300 text-emerald-600',
                        color === 'blue'    && 'dark:text-blue-300 text-blue-600',
                      )}>{value}</p>
                      <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="dashboard-card rounded-xl overflow-hidden">
                  <div className="px-4 pt-3.5 pb-2.5 border-b dark:border-slate-800/60 border-slate-100">
                    <p className="text-sm font-semibold dark:text-white text-slate-700">Rating Distribution</p>
                  </div>
                  <div className="px-4 py-3.5">
                    <RatingChart data={analytics.rating_distribution} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm dark:text-slate-500 text-slate-400">No analytics available</p>
              </div>
            )
          )}

          {activeTab === 'tags' && (
            tags.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-12 h-12 rounded-2xl dark:bg-slate-800 bg-slate-100 flex items-center justify-center mx-auto">
                  <Tag className="h-5 w-5 dark:text-slate-600 text-slate-300" aria-hidden="true" />
                </div>
                <p className="text-sm dark:text-slate-400 text-slate-500">No service tags configured</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t.id}
                    className="px-3 py-1.5 rounded-full text-sm border
                      dark:border-blue-500/30 dark:text-blue-300 dark:bg-blue-500/10
                      border-blue-200 text-blue-700 bg-blue-50"
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            )
          )}

          {activeTab === 'qr' && (
            loadingQr ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin dark:text-slate-500 text-slate-300" aria-hidden="true" />
              </div>
            ) : qrPng ? (
              <div className="space-y-4 max-w-sm">
                <div className="p-4 bg-white rounded-2xl shadow-xl dark:shadow-blue-500/10 ring-1 dark:ring-blue-500/20 ring-slate-200 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrPng}
                    alt={`QR code for ${business.name}`}
                    width={224} height={224}
                    className="rounded-xl block"
                  />
                </div>
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = qrPng
                    a.download = `${business.slug}-qr.png`
                    a.click()
                  }}
                  className="w-full h-11 rounded-xl border font-medium text-sm flex items-center justify-center gap-2
                    dark:border-slate-700/50 border-slate-200
                    dark:text-slate-300 text-slate-600
                    dark:hover:bg-slate-800 hover:bg-slate-50
                    transition-all duration-200 active:scale-95"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download PNG
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm dark:text-slate-500 text-slate-400">QR code unavailable</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
