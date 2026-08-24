'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, QrCode, Tag, BarChart2, Loader2, Download, Settings, Upload, Check, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import RatingChart from '@/components/dashboard/RatingChart'
import { formatPercent, formatRating } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import type { BusinessRow } from './BusinessTable'

interface AnalyticsData {
  total_scans: number
  total_scans_today: number
  average_rating: number
  conversion_rate: number
  reviews_this_month: number
  rating_distribution: { rating: number; count: number }[]
}

type DrawerTab = 'analytics' | 'tags' | 'qr' | 'settings'

const TABS: { id: DrawerTab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'tags',      label: 'Tags',      icon: Tag       },
  { id: 'qr',        label: 'QR Code',   icon: QrCode    },
  { id: 'settings',  label: 'Settings',  icon: Settings  },
]

// ─── Logo uploader component ──────────────────────────────────────────────────

function LogoUploader({
  businessId,
  currentLogoUrl,
  businessName,
  onSaved,
}: {
  businessId: string
  currentLogoUrl: string | null
  businessName: string
  onSaved: (url: string) => void
}) {
  const [logoUrl,   setLogoUrl]   = useState(currentLogoUrl ?? '')
  const [preview,   setPreview]   = useState<string | null>(currentLogoUrl ?? null)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // When a file is picked — convert to base64 data URL for preview & storage
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, SVG)')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPreview(dataUrl)
      setLogoUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  // When URL is typed manually
  function handleUrlChange(val: string) {
    setLogoUrl(val)
    setPreview(val || null)
    setError(null)
    setSaved(false)
  }

  async function handleSave() {
    if (!logoUrl.trim()) { setError('Please provide a logo URL or upload an image'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: logoUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save logo')
      setSaved(true)
      onSaved(logoUrl.trim())
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    setSaving(true)
    try {
      await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: null }),
      })
      setLogoUrl('')
      setPreview(null)
      onSaved('')
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
          <ImageIcon className="h-4 w-4 text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-white text-slate-900">Business Logo</p>
          <p className="text-xs dark:text-slate-500 text-slate-400">
            Shown on the customer review page
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl border-2 dark:border-slate-700 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 dark:bg-slate-800 bg-slate-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold dark:text-slate-500 text-slate-300">
              {businessName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs dark:text-slate-400 text-slate-500 font-medium">
            {preview ? 'Logo preview' : 'No logo set — showing initial letter'}
          </p>
          {/* Upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-medium border
              dark:border-slate-700/50 border-slate-200
              dark:text-slate-300 text-slate-600
              dark:hover:bg-slate-800 hover:bg-slate-50
              transition-all duration-200 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Upload image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            aria-label="Upload logo image"
          />
          <p className="text-xs dark:text-slate-600 text-slate-400">PNG, JPG, WebP, SVG · max 2 MB</p>
        </div>
      </div>

      {/* URL input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide dark:text-slate-400 text-slate-500">
          Or paste image URL
        </label>
        <input
          type="url"
          placeholder="https://example.com/logo.png"
          value={logoUrl.startsWith('data:') ? '' : logoUrl}
          onChange={e => handleUrlChange(e.target.value)}
          className={cn(
            'w-full h-10 px-3.5 rounded-xl border text-sm',
            'dark:bg-slate-800/60 bg-slate-50',
            'dark:text-white text-slate-900',
            'dark:border-slate-700/50 border-slate-200',
            'dark:placeholder:text-slate-500 placeholder:text-slate-400',
            'outline-none focus:ring-2 dark:focus:ring-blue-500/30 focus:ring-blue-400/20',
            'dark:focus:border-blue-500/50 focus:border-blue-400',
            'transition-all duration-200'
          )}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">{error}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !logoUrl.trim()}
          className={cn(
            'flex-1 h-10 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2',
            'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400',
            'shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <><Check className="h-4 w-4" />Saved!</>
          ) : (
            'Save Logo'
          )}
        </button>
        {preview && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="h-10 px-4 rounded-xl border dark:border-red-500/30 border-red-200 text-xs font-medium dark:text-red-400 text-red-600 dark:hover:bg-red-500/10 hover:bg-red-50 transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export default function BusinessDetailDrawer({
  business,
  onClose,
}: {
  business: BusinessRow | null
  onClose: () => void
}) {
  const [activeTab,        setActiveTab]        = useState<DrawerTab>('analytics')
  const [analytics,        setAnalytics]        = useState<AnalyticsData | null>(null)
  const [tags,             setTags]             = useState<{ id: string; label: string }[]>([])
  const [qrPng,            setQrPng]            = useState<string | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingQr,        setLoadingQr]        = useState(false)
  const [currentLogoUrl,   setCurrentLogoUrl]   = useState<string | null>(null)

  useEffect(() => {
    if (!business) {
      setAnalytics(null); setTags([]); setQrPng(null)
      setActiveTab('analytics'); setCurrentLogoUrl(null)
      return
    }

    // Fetch current logo_url from business details
    fetch(`/api/admin/businesses/${business.id}`)
      .then(r => r.json())
      .then(d => { if (d.data?.logo_url) setCurrentLogoUrl(d.data.logo_url) })
      .catch(() => {})

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
  }, [business])

  if (!business) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-white/20 dark:bg-transparent backdrop-blur-sm transition-opacity animate-fade-in-up"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-[500px] z-50 flex flex-col',
          'dark:bg-slate-950/62 bg-white/[0.82] backdrop-blur-2xl',
          'border-l dark:border-white/10 border-white/80',
          'shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_70px_rgba(59,130,246,0.18),0_0_34px_rgba(168,85,247,0.12)]',
          'animate-slide-in-right'
        )}
        role="dialog"
        aria-label={`${business.name} details`}
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b dark:border-slate-800/60 border-slate-200 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              {/* Show logo thumbnail if available */}
              {currentLogoUrl ? (
                <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 border dark:border-slate-700 border-slate-200">
                  <Image src={currentLogoUrl} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 text-xs font-bold uppercase">{business.name[0]}</span>
                </div>
              )}
              <h2 className="text-base font-bold dark:text-white text-slate-900 truncate">
                {business.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs dark:text-slate-500 text-slate-400 font-mono">
                /review/{business.slug}
              </span>
              <Badge variant="outline" className={cn('text-xs rounded-full',
                business.is_active
                  ? 'dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 border-green-200 text-green-700 bg-green-50'
                  : 'dark:border-slate-700 dark:text-slate-500 border-slate-200 text-slate-500'
              )}>
                {business.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize dark:border-slate-700 dark:text-slate-400 rounded-full">
                {business.plan}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={() => window.open(`/review/${business.slug}`, '_blank')}
              className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5
                dark:border-slate-700/50 border-slate-200 border
                dark:text-slate-300 text-slate-600
                dark:hover:bg-slate-800 hover:bg-slate-50
                transition-all duration-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />Preview
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center
                dark:text-slate-400 text-slate-500
                dark:hover:bg-slate-800 hover:bg-slate-100
                transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="px-5 pt-3 pb-0 shrink-0">
          <div className="flex gap-0.5 p-1 rounded-xl dark:bg-slate-900/60 bg-slate-100 border dark:border-slate-800/50 border-slate-200/80">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-medium transition-all duration-300',
                    isActive
                      ? 'dark:bg-slate-800 bg-white dark:text-white text-slate-900 dark:shadow-sm shadow-sm dark:border-slate-700/40 border border-slate-200/80'
                      : 'dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div key={activeTab} className="flex-1 overflow-y-auto px-5 py-4 animate-fade-in-up space-y-4">

          {/* ── Analytics ── */}
          {activeTab === 'analytics' && (
            loadingAnalytics ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl dark:bg-slate-800 bg-slate-100 animate-pulse" />)}
                </div>
                <div className="h-40 rounded-xl dark:bg-slate-800 bg-slate-100 animate-pulse" />
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Scans',  value: analytics.total_scans,                              sub: `${analytics.total_scans_today} today`,  color: 'blue'   },
                    { label: 'Avg Rating',   value: formatRating(analytics.average_rating),             sub: 'out of 5 stars',                        color: 'amber'  },
                    { label: 'Conversion',   value: formatPercent(analytics.conversion_rate),           sub: 'scans → Google',                        color: 'emerald'},
                    { label: 'This Month',   value: analytics.reviews_this_month,                       sub: 'reviews posted',                        color: 'blue' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} className="stat-card rounded-xl p-3.5 border dark:border-slate-700/40 border-slate-200 group hover:scale-[1.02] transition-all duration-200">
                      <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
                      <p className={cn('text-xl font-bold tabular-nums mt-1',
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
                    <p className="text-xs font-semibold dark:text-white text-slate-700">Rating Distribution</p>
                  </div>
                  <div className="px-4 py-3.5">
                    <RatingChart data={analytics.rating_distribution} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm dark:text-slate-500 text-slate-400">No analytics available</p>
              </div>
            )
          )}

          {/* ── Tags ── */}
          {activeTab === 'tags' && (
            tags.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-12 h-12 rounded-2xl dark:bg-slate-800 bg-slate-100 flex items-center justify-center mx-auto">
                  <Tag className="h-5 w-5 dark:text-slate-600 text-slate-300" />
                </div>
                <p className="text-sm dark:text-slate-400 text-slate-500">No service tags configured</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t.id} className="px-3 py-1.5 rounded-full text-sm border dark:border-blue-500/30 dark:text-blue-300 dark:bg-blue-500/10 border-blue-200 text-blue-700 bg-blue-50">
                    {t.label}
                  </span>
                ))}
              </div>
            )
          )}

          {/* ── QR Code ── */}
          {activeTab === 'qr' && (
            loadingQr ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin dark:text-slate-500 text-slate-300" />
              </div>
            ) : qrPng ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-2xl shadow-xl dark:shadow-blue-500/10 ring-1 dark:ring-blue-500/20 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrPng} alt={`QR code for ${business.name}`} width={192} height={192} className="rounded-xl block" />
                  </div>
                </div>
                <button
                  onClick={() => { const a = document.createElement('a'); a.href = qrPng!; a.download = `${business.slug}-qr.png`; a.click() }}
                  className="w-full h-11 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 dark:border-slate-700/50 border-slate-200 dark:text-slate-300 text-slate-600 dark:hover:bg-slate-800 hover:bg-slate-50 transition-all duration-200 active:scale-95"
                >
                  <Download className="h-4 w-4" />Download PNG
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm dark:text-slate-500 text-slate-400">QR code unavailable</p>
              </div>
            )
          )}

          {/* ── Settings — Logo upload ── */}
          {activeTab === 'settings' && (
            <LogoUploader
              businessId={business.id}
              currentLogoUrl={currentLogoUrl}
              businessName={business.name}
              onSaved={(url) => setCurrentLogoUrl(url || null)}
            />
          )}

        </div>
      </aside>
    </>
  )
}
