'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Star, Loader2, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Feedback } from '@/types'

function FeedbackCard({
  item,
  onStatusChange,
}: {
  item: Feedback
  onStatusChange?: (id: string, status: 'open' | 'resolved') => void
}) {
  const [isPending, setIsPending] = useState(false)

  async function toggleStatus() {
    const newStatus = item.status === 'open' ? 'resolved' : 'open'
    setIsPending(true)
    try {
      const res = await fetch('/api/dashboard/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      })
      if (res.ok) onStatusChange?.(item.id, newStatus)
    } finally {
      setIsPending(false)
    }
  }

  const date = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 sm:p-4 space-y-3 transition-all duration-200',
        item.status === 'resolved'
          ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
          : 'bg-slate-900/70 border-slate-700/50 hover:border-slate-600/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: item.rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            ))}
            {Array.from({ length: 5 - item.rating }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
            ))}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs border rounded-full',
              item.status === 'resolved'
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-orange-500/30 text-orange-300 bg-orange-500/10'
            )}
          >
            {item.status === 'resolved'
              ? <><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</>
              : <><Clock className="h-3 w-3 mr-1" />Open</>
            }
          </Badge>
        </div>
        <span className="text-xs text-slate-500 shrink-0">{date}</span>
      </div>

      {/* Message */}
      {item.message && (
        <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>
      )}

      {/* Contact */}
      {item.contact_info && (
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-400">Contact:</span> {item.contact_info}
        </p>
      )}

      {/* Action */}
      <div className="pt-1">
        <button
          onClick={toggleStatus}
          disabled={isPending}
          className={cn(
            'inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium border transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            item.status === 'resolved'
              ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
          )}
          aria-label={item.status === 'resolved' ? 'Mark as open' : 'Mark as resolved'}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : item.status === 'resolved' ? (
            <Clock className="h-3 w-3" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          )}
          {isPending ? 'Saving…' : item.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
        </button>
      </div>
    </div>
  )
}

export default function FeedbackInbox({
  items: initialItems,
  loading,
  onStatusChange,
}: {
  items: Feedback[]
  loading?: boolean
  onStatusChange?: (id: string, status: 'open' | 'resolved') => void
}) {
  const [items, setItems] = useState(initialItems)

  function handleStatusChange(id: string, status: 'open' | 'resolved') {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    onStatusChange?.(id, status)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-800 p-4 space-y-3 animate-pulse">
            <div className="flex gap-2">
              <div className="h-4 w-20 rounded bg-slate-700" />
              <div className="h-4 w-16 rounded bg-slate-700" />
            </div>
            <div className="h-4 w-full rounded bg-slate-700" />
            <div className="h-4 w-3/4 rounded bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  const openItems     = items.filter((i) => i.status === 'open')
  const resolvedItems = items.filter((i) => i.status === 'resolved')

  if (items.length === 0) {
    return (
      <div className="text-center py-10 sm:py-14 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
          <MessageSquare className="h-6 w-6 text-slate-600" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-300">No feedback yet — you&apos;re doing great!</p>
          <p className="text-xs text-slate-500 mt-1">Private feedback from 1-3 star reviews will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {openItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Open ({openItems.length})
          </p>
          {openItems.map((item) => (
            <FeedbackCard key={item.id} item={item} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
      {resolvedItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Resolved ({resolvedItems.length})
          </p>
          {resolvedItems.map((item) => (
            <FeedbackCard key={item.id} item={item} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
