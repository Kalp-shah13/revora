'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  X,
  Printer,
  Sparkles,
  Star,
  Check,
  Layers,
  Palette,
  Type,
  Sliders,
  Scissors,
  ExternalLink,
  Zap,
  Layout,
  Columns2,
  Square,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type StandFormat = 'acrylic_stand' | 'table_tent' | 'window_decal' | 'card_insert'
export type StandTheme = 'sapphire' | 'amber' | 'emerald' | 'obsidian'

interface PrintStudioModalProps {
  isOpen: boolean
  onClose: () => void
  businessName?: string
  reviewUrl: string
  qrPngUrl: string
  accentColor?: string
}

const FORMAT_CONFIG: Record<
  StandFormat,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }>; sizeHint: string }
> = {
  acrylic_stand: {
    label: 'Acrylic Desk Stand',
    desc: '4" × 6" portrait insert for reception counters & cashier desks',
    icon: Layout,
    sizeHint: '4" × 6" Standard Countertop',
  },
  table_tent: {
    label: 'Foldable Table Tent',
    desc: 'Double-sided with center fold for cafe & restaurant tables',
    icon: Columns2,
    sizeHint: 'A5 / 5.8" × 8.3" Dual-Sided',
  },
  window_decal: {
    label: 'Window & Door Decal',
    desc: 'High-contrast square badge for front doors and exit windows',
    icon: Square,
    sizeHint: 'Square Decal 6" × 6"',
  },
  card_insert: {
    label: 'Bag & Bill Insert',
    desc: 'Compact business card size to drop in receipts or shopping bags',
    icon: CreditCard,
    sizeHint: '3.5" × 2" Card Format',
  },
}

const THEME_CONFIG: Record<
  StandTheme,
  { label: string; bg: string; text: string; subtext: string; border: string; badgeBg: string; badgeText: string; accent: string }
> = {
  sapphire: {
    label: 'Royal Blue',
    bg: 'bg-gradient-to-b from-blue-900 to-indigo-950',
    text: 'text-white',
    subtext: 'text-blue-100',
    border: 'border-blue-800',
    badgeBg: 'bg-blue-800/60 border border-blue-400/30',
    badgeText: 'text-blue-100',
    accent: '#2563EB',
  },
  amber: {
    label: 'Luxury Gold',
    bg: 'bg-gradient-to-b from-amber-900 to-stone-950',
    text: 'text-amber-50',
    subtext: 'text-amber-200',
    border: 'border-amber-800',
    badgeBg: 'bg-amber-900/60 border border-amber-400/30',
    badgeText: 'text-amber-200',
    accent: '#D97706',
  },
  emerald: {
    label: 'Health Emerald',
    bg: 'bg-gradient-to-b from-emerald-900 to-slate-950',
    text: 'text-emerald-50',
    subtext: 'text-emerald-200',
    border: 'border-emerald-800',
    badgeBg: 'bg-emerald-900/60 border border-emerald-400/30',
    badgeText: 'text-emerald-200',
    accent: '#059669',
  },
  obsidian: {
    label: 'Slate Minimal',
    bg: 'bg-slate-900',
    text: 'text-white',
    subtext: 'text-slate-300',
    border: 'border-slate-800',
    badgeBg: 'bg-slate-800 border border-slate-700',
    badgeText: 'text-slate-200',
    accent: '#475569',
  },
}

const HEADLINE_PRESETS = [
  'Loved your visit today?',
  'How was your experience today?',
  'Help our small business grow!',
  'Enjoyed your visit? Rate us!',
]

const SUBTITLE_PRESETS = [
  'Scan to leave a Google review — it only takes 30 seconds!',
  'Scan with your phone camera to share your review on Google in 30 seconds.',
  'Your feedback means the world to our team. Tap to leave a quick Google review.',
]

export default function PrintStudioModal({
  isOpen,
  onClose,
  businessName = 'Your Business',
  reviewUrl,
  qrPngUrl,
  accentColor = '#2563EB',
}: PrintStudioModalProps) {
  const [format, setFormat] = useState<StandFormat>('acrylic_stand')
  const [theme, setTheme] = useState<StandTheme>('sapphire')
  const [headline, setHeadline] = useState('Loved your visit today?')
  const [subtitle, setSubtitle] = useState('Scan to leave a Google review — it only takes 30 seconds!')
  const [showStars, setShowStars] = useState(true)
  const [showFastPill, setShowFastPill] = useState(true)
  const [showGoogleBadge, setShowGoogleBadge] = useState(true)
  const [showFoldGuides, setShowFoldGuides] = useState(true)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const currentTheme = THEME_CONFIG[theme]

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // unavailable
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:static print:inset-auto">
      {/* ── Main Modal Card (Crisp Executive Light Theme) ── */}
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 print:shadow-none print:border-none print:h-auto print:max-h-none print:bg-white print:w-full print:max-w-none">
        
        {/* Header (Light Theme) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Marketing Stand &amp; Print Studio</h2>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Ready-to-Print
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Design and print physical counter stands, table tents &amp; decals for <span className="text-slate-900 font-semibold">{businessName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden print:block print:overflow-visible">
          
          {/* ── Left Controls Sidebar (Light Theme) ── */}
          <div className="lg:col-span-5 border-r border-slate-200 p-5 space-y-6 overflow-y-auto bg-slate-50/70 print:hidden">
            
            {/* Format Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                1. Select Physical Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FORMAT_CONFIG) as StandFormat[]).map((fmtKey) => {
                  const cfg = FORMAT_CONFIG[fmtKey]
                  const isActive = format === fmtKey
                  return (
                    <button
                      key={fmtKey}
                      type="button"
                      onClick={() => setFormat(fmtKey)}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-xs',
                        isActive
                          ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <cfg.icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-slate-600')} />
                        {isActive && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="mt-2">
                        <p className={cn('text-xs font-bold', isActive ? 'text-blue-900' : 'text-slate-900')}>
                          {cfg.label}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cfg.sizeHint}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Theme Presets */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                2. Style &amp; Color Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(THEME_CONFIG) as StandTheme[]).map((themeKey) => {
                  const cfg = THEME_CONFIG[themeKey]
                  const isActive = theme === themeKey
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => setTheme(themeKey)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 shadow-xs',
                        isActive
                          ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-xs"
                        style={{ backgroundColor: cfg.accent }}
                      />
                      <span className={cn('text-xs font-medium truncate', isActive ? 'text-blue-900 font-bold' : 'text-slate-700')}>
                        {cfg.label.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Headline Customizer */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                3. Headline Message
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={60}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-colors"
                placeholder="e.g. Loved your visit today?"
              />
              <div className="flex flex-wrap gap-1.5">
                {HEADLINE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setHeadline(p)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 shadow-xs transition-all cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtitle Customizer */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                4. Call to Action / Subtitle
              </label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={140}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-colors resize-none"
                placeholder="e.g. Scan to leave us a Google review..."
              />
              <div className="flex flex-col gap-1">
                {SUBTITLE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSubtitle(p)}
                    className="text-[10px] text-left px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-all truncate cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                5. Badges &amp; Print Marks
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-100/60 shadow-xs">
                  <input
                    type="checkbox"
                    checked={showStars}
                    onChange={(e) => setShowStars(e.target.checked)}
                    className="rounded accent-blue-600 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">5-Star Badges</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-100/60 shadow-xs">
                  <input
                    type="checkbox"
                    checked={showFastPill}
                    onChange={(e) => setShowFastPill(e.target.checked)}
                    className="rounded accent-blue-600 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">&quot;Takes 30s&quot; Pill</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-100/60 shadow-xs">
                  <input
                    type="checkbox"
                    checked={showGoogleBadge}
                    onChange={(e) => setShowGoogleBadge(e.target.checked)}
                    className="rounded accent-blue-600 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">Google Badge</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-100/60 shadow-xs">
                  <input
                    type="checkbox"
                    checked={showFoldGuides}
                    onChange={(e) => setShowFoldGuides(e.target.checked)}
                    className="rounded accent-blue-600 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">Cut &amp; Fold Guides</span>
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Link Copied!' : 'Copy Review Link'}</span>
              </button>
            </div>
          </div>

          {/* ── Right Live Printable Preview Area (Light Theme) ── */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-100/80 overflow-y-auto print:p-0 print:bg-white print:overflow-visible print:block">
            
            {/* Format Info Banner (hidden in print) */}
            <div className="mb-4 text-center print:hidden">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs">
                {(() => {
                  const SelectedIcon = FORMAT_CONFIG[format].icon
                  return <SelectedIcon className="w-4 h-4 text-blue-600" />
                })()}
                <span className="font-semibold">{FORMAT_CONFIG[format].label}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-mono text-[11px]">{FORMAT_CONFIG[format].sizeHint}</span>
              </span>
            </div>

            {/* ── PRINT TARGET CONTAINER (Exact Printable Area) ── */}
            <div
              id="revora-print-stand-target"
              className={cn(
                'relative transition-all duration-300 shadow-xl rounded-3xl overflow-hidden flex flex-col items-center justify-between text-center select-none print:shadow-none print:rounded-none print:border-none print:m-0 print:p-0',
                currentTheme.bg,
                currentTheme.text,
                currentTheme.border,
                // Adaptive sizes based on chosen format:
                format === 'acrylic_stand' && 'w-[320px] sm:w-[360px] min-h-[500px] p-7 border-2',
                format === 'table_tent'    && 'w-[340px] sm:w-[400px] min-h-[580px] p-6 border-2',
                format === 'window_decal'  && 'w-[340px] sm:w-[380px] min-h-[380px] p-7 border-4 rounded-3xl',
                format === 'card_insert'   && 'w-[300px] sm:w-[340px] min-h-[300px] p-6 border-2'
              )}
            >
              {/* Optional Cut & Fold Guidelines (Dotted borders for printing) */}
              {showFoldGuides && (
                <div className="absolute inset-1.5 border border-dashed border-slate-400/50 rounded-2xl pointer-events-none flex items-start justify-between p-1.5 text-[9px] text-slate-400 print:border-slate-400">
                  <div className="flex items-center gap-1">
                    <Scissors className="w-2.5 h-2.5" />
                    <span>Cut margin</span>
                  </div>
                  {format === 'table_tent' && (
                    <span className="font-mono text-[8px] uppercase">Fold Center ⮯</span>
                  )}
                </div>
              )}

              {/* ── FORMAT 1: ACRYLIC COUNTER STAND ── */}
              {format === 'acrylic_stand' && (
                <div className="w-full flex-1 flex flex-col justify-between items-center py-2 space-y-4">
                  {/* Top Header */}
                  <div className="space-y-2">
                    {showStars && (
                      <div className="flex justify-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                    <h3 className="text-xl font-extrabold tracking-tight uppercase" style={{ letterSpacing: '0.05em' }}>
                      {businessName}
                    </h3>
                  </div>

                  {/* Headline & Subtitle */}
                  <div className="space-y-1.5 px-2">
                    <p className="text-lg font-extrabold leading-snug">
                      {headline}
                    </p>
                    <p className={cn('text-xs leading-relaxed max-w-[280px] mx-auto', currentTheme.subtext)}>
                      {subtitle}
                    </p>
                  </div>

                  {/* QR Box with High-Contrast White Background for Reliable Scanning */}
                  <div className="relative p-3.5 bg-white rounded-2xl shadow-lg ring-1 ring-slate-200 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrPngUrl}
                      alt={`Review QR for ${businessName}`}
                      width={170}
                      height={170}
                      className="rounded-xl block"
                    />
                    {showGoogleBadge && (
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-md border border-slate-200 flex items-center gap-1 whitespace-nowrap">
                        <span className="text-blue-600 font-extrabold">G</span>
                        <span>Google Reviews</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Perks */}
                  <div className="space-y-2 pt-2">
                    {showFastPill && (
                      <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs', currentTheme.badgeBg, currentTheme.badgeText)}>
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Instant Camera Scan • Takes 30s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── FORMAT 2: FOLDABLE TABLE TENT (Restaurant / Cafe Table) ── */}
              {format === 'table_tent' && (
                <div className="w-full flex-1 flex flex-col justify-between items-center py-2 space-y-4">
                  {/* Top Face */}
                  <div className="w-full border-b border-dashed border-slate-300 pb-4 text-center space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      Side A (Table Facing)
                    </p>
                    <p className="text-sm font-bold">{headline}</p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Center Main Panel */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold tracking-wide uppercase">{businessName}</h3>
                    <p className={cn('text-xs px-2', currentTheme.subtext)}>{subtitle}</p>
                  </div>

                  <div className="relative p-3 bg-white rounded-2xl shadow-lg ring-1 ring-slate-200 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrPngUrl}
                      alt={`Review QR for ${businessName}`}
                      width={160}
                      height={160}
                      className="rounded-xl block"
                    />
                    {showGoogleBadge && (
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-[8px] font-bold px-2.5 py-0.5 rounded-full shadow border border-slate-200 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>Google Review</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {showFastPill && (
                      <div className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium shadow-xs', currentTheme.badgeBg, currentTheme.badgeText)}>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Share your feedback in 30 seconds</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full border-t border-dashed border-slate-300 pt-2 text-center">
                    <p className="text-[9px] font-mono text-slate-400 tracking-wider">
                      --- FOLD HERE FOR STANDING TENT ---
                    </p>
                  </div>
                </div>
              )}

              {/* ── FORMAT 3: WINDOW & DOOR DECAL (Bold Square) ── */}
              {format === 'window_decal' && (
                <div className="w-full flex-1 flex flex-col justify-between items-center py-2 space-y-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                      <span>Rate us on Google</span>
                    </div>
                    <h3 className="text-xl font-extrabold uppercase tracking-tight">{businessName}</h3>
                  </div>

                  <div className="relative p-3.5 bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrPngUrl}
                      alt={`Review QR for ${businessName}`}
                      width={180}
                      height={180}
                      className="rounded-xl block"
                    />
                  </div>

                  <div className="space-y-1 px-2">
                    <p className="text-sm font-bold leading-tight">{headline}</p>
                    {showStars && (
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── FORMAT 4: BAG & BILL CARD INSERT ── */}
              {format === 'card_insert' && (
                <div className="w-full flex-1 flex flex-col justify-between items-center py-2 space-y-2">
                  <div className="flex items-center justify-between w-full border-b pb-2 border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wide truncate max-w-[180px]">
                      {businessName}
                    </span>
                    {showStars && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full py-1">
                    <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrPngUrl}
                        alt={`Review QR for ${businessName}`}
                        width={95}
                        height={95}
                        className="rounded-lg block"
                      />
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-xs font-extrabold leading-snug">{headline}</p>
                      <p className={cn('text-[10px] leading-relaxed', currentTheme.subtext)}>
                        Scan with your phone to leave us a quick Google review!
                      </p>
                      {showFastPill && (
                        <span className={cn('inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-semibold shadow-xs', currentTheme.badgeBg, currentTheme.badgeText)}>
                          <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>30 seconds</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full pt-1 border-t border-slate-200 flex justify-center items-center text-[9px] text-slate-500 font-medium">
                    <span>Thank you for your visit!</span>
                  </div>
                </div>
              )}

            </div>

            {/* Print Help Footer (hidden in print) */}
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="hover:text-blue-600 underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print this format (Use standard Letter / A4 or Photo paper)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── Global Print Styles ── */}
      <style jsx global>{`
        @media print {
          /* Hide all surrounding page content and modal UI */
          body * {
            visibility: hidden !important;
          }
          /* Show ONLY our printable stand */
          #revora-print-stand-target,
          #revora-print-stand-target * {
            visibility: visible !important;
          }
          #revora-print-stand-target {
            position: absolute !important;
            left: 50% !important;
            top: 40px !important;
            transform: translateX(-50%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 auto !important;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  )
}
