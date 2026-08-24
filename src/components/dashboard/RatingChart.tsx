import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingBar {
  rating: number
  count: number
}

interface RatingChartProps {
  data: RatingBar[]
  loading?: boolean
}

const BAR_COLORS: Record<number, string> = {
  5: 'bg-gradient-to-r from-emerald-500 to-green-400',
  4: 'bg-gradient-to-r from-blue-500 to-cyan-400',
  3: 'bg-gradient-to-r from-amber-500 to-yellow-400',
  2: 'bg-gradient-to-r from-orange-500 to-amber-400',
  1: 'bg-gradient-to-r from-red-500 to-rose-400',
}

const GLOW_COLORS: Record<number, string> = {
  5: 'shadow-emerald-500/30',
  4: 'shadow-blue-500/30',
  3: 'shadow-amber-500/30',
  2: 'shadow-orange-500/30',
  1: 'shadow-red-500/30',
}

export default function RatingChart({ data, loading }: RatingChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const sorted = [...data].sort((a, b) => b.rating - a.rating)

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Rating distribution loading">
        {[5, 4, 3, 2, 1].map((r) => (
          <div key={r} className="flex items-center gap-3">
            <div className="h-3 w-8 rounded bg-slate-700 animate-pulse shrink-0" />
            <div className="h-3 flex-1 rounded-full bg-slate-700 animate-pulse" />
            <div className="h-3 w-5 rounded bg-slate-700 animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="text-center py-6 space-y-2">
        <div className="flex justify-center gap-1">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className="h-5 w-5 text-slate-700" aria-hidden="true" />
          ))}
        </div>
        <p className="text-sm text-slate-500">No ratings yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5" role="list" aria-label="Rating distribution chart">
      {sorted.map(({ rating, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const barColor = BAR_COLORS[rating] ?? 'bg-slate-500'
        const glow = GLOW_COLORS[rating] ?? ''

        return (
          <div
            key={rating}
            className="flex items-center gap-2.5 sm:gap-3"
            role="listitem"
            aria-label={`${rating} star: ${count} ratings (${pct}%)`}
          >
            {/* Star label */}
            <div className="flex items-center gap-0.5 w-8 sm:w-10 shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-slate-300 tabular-nums">{rating}</span>
              <Star className="h-3 w-3 text-amber-400 fill-amber-400 ml-0.5" aria-hidden="true" />
            </div>

            {/* Track */}
            <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700 ease-out shadow-sm', barColor, pct > 0 ? glow : '')}
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            </div>

            {/* Count */}
            <span className="text-xs text-slate-400 tabular-nums w-5 text-right shrink-0">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
