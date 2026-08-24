'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceTag } from '@/types'

interface TagsManagerProps {
  tags: ServiceTag[]
  loading?: boolean
}

export default function TagsManager({ tags: initialTags, loading }: TagsManagerProps) {
  const [tags, setTags]         = useState(initialTags)
  const [newLabel, setNewLabel] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  async function handleAdd() {
    const label = newLabel.trim()
    if (!label) return
    if (tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
      setError('This tag already exists')
      return
    }
    setError(null)
    setIsAdding(true)
    try {
      const res = await fetch('/api/dashboard/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add tag')
      setTags((prev) => [...prev, data.data as ServiceTag])
      setNewLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch('/api/dashboard/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete tag')
      setTags((prev) => prev.filter((t) => t.id !== id))
    } catch {
      // silently fail
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-2">
          <div className="h-11 flex-1 rounded-xl bg-slate-700" />
          <div className="h-11 w-20 rounded-xl bg-slate-700" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4].map((i) => <div key={i} className="h-8 w-24 rounded-full bg-slate-700" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Fast Service, Great Food…"
            value={newLabel}
            onChange={(e) => { setNewLabel(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            disabled={isAdding}
            maxLength={50}
            aria-label="New service tag"
            className={cn(
              'flex-1 h-11 px-4 rounded-xl border bg-slate-900/60 text-sm text-white placeholder:text-slate-500',
              'border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none',
              'transition-all duration-200 disabled:opacity-50'
            )}
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !newLabel.trim()}
            className={cn(
              'h-11 px-4 rounded-xl font-semibold text-sm text-white shrink-0',
              'bg-gradient-to-r from-blue-600 to-cyan-500',
              'hover:from-blue-500 hover:to-cyan-400',
              'shadow-lg shadow-blue-500/20',
              'transition-all duration-200 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
              'flex items-center gap-1.5'
            )}
            aria-label="Add tag"
          >
            {isAdding
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <Plus className="h-4 w-4" aria-hidden="true" />
            }
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Tag pills */}
      {tags.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
            <Tag className="h-5 w-5 text-slate-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-slate-400">No tags yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Add tags like &quot;Fast Service&quot; or &quot;Great Ambience&quot; to help customers highlight what they loved.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Service tags">
          {tags.map((tag) => (
            <div
              key={tag.id}
              role="listitem"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-sm text-blue-300 group transition-all hover:border-blue-400/50"
            >
              <span>{tag.label}</span>
              <button
                onClick={() => handleDelete(tag.id)}
                disabled={deletingId === tag.id}
                aria-label={`Remove tag: ${tag.label}`}
                className="text-blue-400/60 hover:text-red-400 focus:outline-none transition-colors rounded ml-0.5"
              >
                {deletingId === tag.id
                  ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  : <X className="h-3 w-3" aria-hidden="true" />
                }
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Tags appear as selectable chips on your review page. Customers can pick up to 3.
      </p>
    </div>
  )
}
