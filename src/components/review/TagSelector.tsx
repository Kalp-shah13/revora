'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Tag {
  id: string
  label: string
}

interface TagSelectorProps {
  tags: Tag[]
  selected: string[]
  onChange: (selected: string[]) => void
  maxSelect?: number
  disabled?: boolean
}

export default function TagSelector({
  tags,
  selected,
  onChange,
  maxSelect = 3,
  disabled,
}: TagSelectorProps) {
  function toggle(id: string) {
    if (disabled) return
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else if (selected.length < maxSelect) {
      onChange([...selected, id])
    }
  }

  const reachedMax = selected.length >= maxSelect

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 text-center">
        Select up to {maxSelect} highlights{' '}
        <span className="text-slate-400">({selected.length}/{maxSelect})</span>
      </p>
      <div
        className="flex flex-wrap gap-2 justify-center"
        role="group"
        aria-label="Select service highlights"
      >
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.id)
          const isDisabled = disabled || (!isSelected && reachedMax)

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={`${tag.label}${isSelected ? ' — selected' : ''}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
                isSelected
                  ? 'bg-blue-600 !text-white border-blue-600 shadow-sm'
                  : isDisabled
                  ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
              )}
            >
              {isSelected && (
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              {tag.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
