'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Link2, Check, Loader2, QrCode, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QRData {
  review_url: string
  png_data_url: string
  svg: string
}

export default function QRCodeDisplay() {
  const [qrData, setQrData]   = useState<QRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/qr')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setQrData(d.data)
        else setError('Could not load QR code')
      })
      .catch(() => setError('Could not load QR code'))
      .finally(() => setLoading(false))
  }, [])

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
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
          <QrCode className="h-6 w-6 text-slate-600" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-400">{error ?? 'QR code unavailable'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* QR image — with neon glow frame */}
      <div className="flex justify-center">
        <div className="relative p-3 sm:p-4 bg-white rounded-2xl shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/20 inline-block">
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
      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5">
        <Link2 className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-400 truncate flex-1 font-mono">
          {qrData.review_url}
        </p>
        <button
          onClick={copyLink}
          className={cn(
            'h-7 px-2.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 transition-all',
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600'
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
            className="h-10 rounded-xl border border-slate-700/50 bg-slate-900/60 text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            aria-label={`Download QR code as ${label}`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Print page */}
      <button
        onClick={() => {
          const slug = qrData.review_url.split('/review/')[1]
          if (slug) window.open(`/review/${slug}/qr`, '_blank')
        }}
        className="w-full h-10 rounded-xl border border-blue-500/30 bg-blue-500/10 text-sm text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        aria-label="Open print-friendly QR page"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Print-Ready QR Page
      </button>

      <p className="text-xs text-slate-500 text-center">
        Print and display at your location
      </p>
    </div>
  )
}
