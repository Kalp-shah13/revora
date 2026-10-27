'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Link2, Check, Loader2, QrCode, Printer, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import PrintStudioModal from './PrintStudioModal'

interface QRData {
  review_url: string
  png_data_url: string
  svg: string
  business_name?: string
  accent_color?: string
}

export default function QRCodeDisplay({ businessId }: { businessId?: string }) {
  const [qrData, setQrData]       = useState<QRData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [copied, setCopied]       = useState(false)
  const [studioOpen, setStudioOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    const url = businessId
      ? `/api/dashboard/qr?businessId=${encodeURIComponent(businessId)}`
      : '/api/dashboard/qr'

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setQrData(d.data)
        else setError('Could not load QR code')
      })
      .catch(() => setError('Could not load QR code'))
      .finally(() => setLoading(false))
  }, [businessId])

  async function copyLink() {
    if (!qrData) return
    try {
      await navigator.clipboard.writeText(qrData.review_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* unavailable */ }
  }

  function downloadPng() {
    if (!qrData) return
    const a = document.createElement('a')
    a.href = qrData.png_data_url
    a.download = 'review-qr-code.png'
    a.click()
  }

  function downloadSvg() {
    if (!qrData) return
    const blob = new Blob([qrData.svg], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'review-qr-code.svg'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-center">
          <div className="w-48 h-48 rounded-2xl bg-slate-700" />
        </div>
        <div className="h-10 w-full rounded-xl bg-slate-700" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-xl bg-slate-700" />
          <div className="h-10 flex-1 rounded-xl bg-slate-700" />
        </div>
      </div>
    )
  }

  if (error || !qrData) {
    return (
      <div className="text-center py-10 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
          <QrCode className="h-6 w-6 text-slate-400" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-500">{error ?? 'QR code unavailable'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* QR image — with crisp light frame */}
      <div className="flex justify-center">
        <div className="relative p-3 sm:p-4 bg-white rounded-2xl shadow-lg border border-slate-200 inline-block">
          <Image
            src={qrData.png_data_url}
            alt="QR code for your review page"
            width={180}
            height={180}
            className="rounded-xl block"
            unoptimized
          />
        </div>
      </div>

      {/* Review URL */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
        <Link2 className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-600 truncate flex-1 font-mono">
          {qrData.review_url}
        </p>
        <button
          onClick={copyLink}
          className={cn(
            'h-7 px-2.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 transition-all',
            copied
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-xs'
          )}
          aria-label={copied ? 'Link copied' : 'Copy review link'}
        >
          {copied
            ? <><Check className="h-3.5 w-3.5" />Copied!</>
            : <><Link2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Copy</span></>
          }
        </button>
      </div>

      {/* Download buttons */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'PNG', action: downloadPng },
          { label: 'SVG', action: downloadSvg },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="h-10 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            aria-label={`Download QR code as ${label}`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Open Stand & Marketing Material Studio */}
      <button
        onClick={() => setStudioOpen(true)}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        aria-label="Open Marketing Stand & Print Studio"
      >
        <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
        <span>Open Stand &amp; Print Studio</span>
      </button>



      <p className="text-xs text-slate-500 text-center">
        Create physical acrylic stands, table tents &amp; decals
      </p>

      {/* Modal Studio */}
      <PrintStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        businessName={qrData.business_name || 'Your Business'}
        reviewUrl={qrData.review_url}
        qrPngUrl={qrData.png_data_url}
        accentColor={qrData.accent_color}
      />
    </div>
  )
}
