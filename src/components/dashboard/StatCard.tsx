'use client'

import { useEffect, useRef, useState } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  borderColor?: string
  glowColor?: string
  loading?: boolean
}

/** Animates a numeric value from 0 → target on mount */
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0)
  const frame = useRef<number>(0)

  useEffect(() => {
    if (target === 0) { setDisplay(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return display
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor  = 'text-blue-400',
  iconBg     = 'bg-blue-500/15',
  borderColor = 'hover:border-blue-500/30',
  glowColor  = 'hover:shadow-blue-500/15',
  loading,
}: StatCardProps) {
  const isNumeric = typeof value === 'number'
  const animated  = useCountUp(isNumeric ? (value as number) : 0)

  if (loading) {
    return (
      <div className="stat-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-20 rounded-full bg-slate-800 animate-pulse" />
          <div className="h-10 w-10 rounded-xl bg-slate-800 animate-pulse" />
        </div>
        <div className="h-9 w-14 rounded-lg bg-slate-800 animate-pulse" />
        <div className="h-2.5 w-24 rounded-full bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'stat-card rounded-2xl p-4 sm:p-5 group cursor-default',
        'border border-slate-800/50 transition-all duration-300',
        'hover:scale-[1.03] hover:-translate-y-0.5',
        'hover:shadow-xl',
        borderColor, glowColor,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">
            {isNumeric ? animated : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          )}
        </div>

        {/* Icon — spins slightly on hover */}
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            'border border-white/5 transition-all duration-300',
            'group-hover:scale-110 group-hover:rotate-6',
            iconBg,
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-5 w-5 transition-all duration-300', iconColor)} />
        </div>
      </div>

      {/* Bottom accent line — slides in on hover */}
      <div className="mt-3 h-px w-0 group-hover:w-full transition-all duration-500 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
    </div>
  )
}
