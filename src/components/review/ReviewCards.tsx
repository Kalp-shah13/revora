'use client'

import { useState } from 'react'
import { Copy, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ReviewCardsProps {
  variants: string[]
  onSelect: (text: string) => void
  disabled?: boolean
}

export default function ReviewCards({ variants, onSelect, disabled }: ReviewCardsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editedTexts, setEditedTexts] = useState<string[]>(variants)

  function handleSelect(index: number) {
    setSelectedIndex(index)
  }

  function handleEdit(index: number, value: string) {
    const updated = [...editedTexts]
    updated[index] = value
    setEditedTexts(updated)
  }

  async function handleCopyAndContinue() {
    if (selectedIndex === null) return
    const text = editedTexts[selectedIndex]
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(selectedIndex)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      // Clipboard API may be unavailable in some browsers — silently ignore
    }
    onSelect(text)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 text-center">
        Pick the review that feels most like you — you can lightly edit it
      </p>

      {/* Cards */}
      <div className="space-y-3">
        {editedTexts.map((text, index) => {
          const isSelected = selectedIndex === index
          return (
            <div
              key={index}
              onClick={() => !disabled && handleSelect(index)}
              className={cn(
                'rounded-xl border p-4 cursor-pointer transition-all duration-150',
                isSelected
                  ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-400'
                  : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
              )}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Review option ${index + 1}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  !disabled && handleSelect(index)
                }
              }}
            >
              <div className="flex items-start gap-2">
                {/* Radio indicator */}
                <div
                  className={cn(
                    'mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                    isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                  )}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>

                {/* Text — editable when selected */}
                {isSelected ? (
                  <textarea
                    value={text}
                    onChange={(e) => handleEdit(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    rows={4}
                    disabled={disabled}
                    aria-label="Edit your review text"
                    className="flex-1 text-sm text-slate-700 leading-relaxed bg-transparent resize-none focus:outline-none w-full"
                  />
                ) : (
                  <p className="flex-1 text-sm text-slate-700 leading-relaxed">{text}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <Button
        onClick={handleCopyAndContinue}
        disabled={selectedIndex === null || disabled}
        className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base shadow-sm"
        aria-label="Copy review and open Google"
      >
        {copiedIndex !== null ? (
          <>
            <Check className="mr-2 h-5 w-5" aria-hidden="true" />
            Copied! Opening Google…
          </>
        ) : (
          <>
            <Copy className="mr-2 h-5 w-5" aria-hidden="true" />
            Copy & Post to Google
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="text-xs text-slate-400 text-center">
        Your review text will be copied — then paste it on Google
      </p>
    </div>
  )
}
