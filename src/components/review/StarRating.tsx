'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  onSelect: (rating: number) => void
  disabled?: boolean
}

const LABELS = ['Terrible', 'Poor', 'OK', 'Good', 'Excellent']

export default function StarRating({ onSelect, disabled }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)

  function handleSelect(rating: number) {
    if (disabled) return
    setSelected(rating)
    onSelect(rating)
  }

  const active = hovered || selected

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Stars */}
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Rate your experience from 1 to 5 stars"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleSelect(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onFocus={() => !disabled && setHovered(star)}
            onBlur={() => !disabled && setHovered(0)}
            disabled={disabled}
            aria-label={`Rate ${star} out of 5 stars — ${LABELS[star - 1]}`}
            aria-pressed={selected === star}
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110 active:scale-95',
              star <= active
                ? 'bg-amber-50'
                : 'bg-slate-50'
            )}
          >
            <Star
              className={cn(
                'w-8 h-8 transition-colors duration-150',
                star <= active
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-200 text-slate-200'
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      {/* Label */}
      <p
        className={cn(
          'text-sm font-medium h-5 transition-opacity duration-150',
          active > 0 ? 'opacity-100' : 'opacity-0'
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {active > 0 ? (
          <span
            className={cn(
              active >= 4 ? 'text-green-600' : active === 3 ? 'text-amber-600' : 'text-red-500'
            )}
          >
            {LABELS[active - 1]}
          </span>
        ) : null}
      </p>
    </div>
  )
}
