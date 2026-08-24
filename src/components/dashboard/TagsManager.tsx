'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Tag, Wrench, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceTag } from '@/types'

interface TagsManagerProps {
  tags: ServiceTag[]
  loading?: boolean
}

// ─── Single tag section ───────────────────────────────────────────────────────

function TagSection({
  type,
  label,
  description,
  icon: Icon,
  accentClass,
  borderClass,
  tags,
  onAdd,
  onDelete,
  deletingId,
}: {
  type: 'service' | 'category'
  label: string
  description: string
  icon: React.ElementType
  accentClass: string
  borderClass: string
  tags: ServiceTag[]
  onAdd: (label: string, type: 'service' | 'category') => Promise<void>
  onDelete: (id: string) => Promise<void>
  deletingId: string | null
}) {
  const [newLabel, setNewLabel] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleAdd() {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    if (tags.some(t => t.label.toLowerCase() === trimmed.toLowerCase())) {
      setError('This tag already exists')
      return
    }
    setError(null)
    setIsAdding(true)
    try {
      await onAdd(trimmed, type)
      setNewLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className={cn(
      'rounded-2xl border p-4 space-y-3 transition-all duration-200',
      'dark:bg-slate-900/40 bg-white',
      borderClass
    )}>
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', accentClass)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-white text-slate-900">{label}</p>
          <p className="text-xs dark:text-slate-500 text-slate-400">{description}</p>
        </div>
        <span className="ml-auto text-xs dark:text-slate-500 text-slate-400 tabular-nums">
          {tags.length} tag{tags.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add input */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={
              type === 'service'
                ? 'e.g. Fast Service, Website Development…'
                : 'e.g. Great Ambience, Good People…'
            }
            value={newLabel}
            onChange={e => { setNewLabel(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            disabled={isAdding}
            maxLength={50}
            aria-label={`New ${label.toLowerCase()}`}
            className={cn(
              'flex-1 h-10 px-3.5 rounded-xl border text-sm',
              'dark:bg-slate-800/60 bg-slate-50',
              'dark:text-white text-slate-900',
              'dark:border-slate-700/50 border-slate-200',
              'dark:placeholder:text-slate-500 placeholder:text-slate-400',
              'outline-none focus:ring-2 dark:focus:ring-blue-500/30 focus:ring-blue-400/20',
              'dark:focus:border-blue-500/50 focus:border-blue-400',
              'transition-all duration-200 disabled:opacity-50'
            )}
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !newLabel.trim()}
            className={cn(
              'h-10 px-3.5 rounded-xl font-semibold text-sm btn-primary-solid shrink-0',
              'flex items-center gap-1.5 transition-all duration-200 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
              'disabled:hover:bg-blue-600'
            )}
            aria-label={`Add ${label.toLowerCase()}`}
          >
            {isAdding
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              : <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            }
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Tag pills */}
      {tags.length === 0 ? (
        <p className="text-xs dark:text-slate-500 text-slate-400 text-center py-2">
          No {label.toLowerCase()} yet. Add one above.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2" role="list" aria-label={label}>
          {tags.map(tag => (
            <div
              key={tag.id}
              role="listitem"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all',
                'dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 bg-blue-50 text-blue-700'
              )}
            >
              <span>{tag.label}</span>
              <button
                onClick={() => onDelete(tag.id)}
                disabled={deletingId === tag.id}
                aria-label={`Remove tag: ${tag.label}`}
                className="hover:text-red-400 focus:outline-none transition-colors rounded ml-0.5 opacity-60 hover:opacity-100"
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
    </div>
  )
}

// ─── Main TagsManager ─────────────────────────────────────────────────────────

export default function TagsManager({ tags: initialTags, loading }: TagsManagerProps) {
  const [tags,       setTags]       = useState<ServiceTag[]>(initialTags)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Normalise: treat tags without tag_type as 'service' (backwards compat)
  const serviceTags  = tags.filter(t => !t.tag_type || t.tag_type === 'service')
  const categoryTags = tags.filter(t => t.tag_type === 'category')

  async function handleAdd(label: string, type: 'service' | 'category') {
    const res = await fetch('/api/dashboard/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, tag_type: type }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to add tag')
    setTags(prev => [...prev, data.data as ServiceTag])
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
      setTags(prev => prev.filter(t => t.id !== id))
    } catch { /* silently ignore */ }
    finally { setDeletingId(null) }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2].map(i => (
          <div key={i} className="rounded-2xl border dark:border-slate-700/50 border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl dark:bg-slate-700 bg-slate-100" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded dark:bg-slate-700 bg-slate-100" />
                <div className="h-2.5 w-44 rounded dark:bg-slate-800 bg-slate-50" />
              </div>
            </div>
            <div className="h-10 w-full rounded-xl dark:bg-slate-700 bg-slate-100" />
            <div className="flex flex-wrap gap-2">
              {[1,2,3].map(j => <div key={j} className="h-7 w-24 rounded-full dark:bg-slate-700 bg-slate-100" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Service Tags section */}
      <TagSection
        type="service"
        label="Service Tags"
        description="The specific services you offer — customer picks exactly 1"
        icon={Wrench}
        accentClass="dark:bg-blue-500/15 dark:border dark:border-blue-500/20 bg-blue-50 border border-blue-100 text-blue-500"
        borderClass="dark:border-slate-700/40 border-slate-200"
        tags={serviceTags}
        onAdd={handleAdd}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      {/* Category Tags section */}
      <TagSection
        type="category"
        label="Category Tags"
        description="Experience qualities — customer picks at least 1"
        icon={Grid3X3}
        accentClass="dark:bg-blue-500/15 dark:border dark:border-blue-500/20 bg-blue-50 border border-blue-100 text-blue-500"
        borderClass="dark:border-slate-700/40 border-slate-200"
        tags={categoryTags}
        onAdd={handleAdd}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      {/* How it works hint */}
      <div className="rounded-xl dark:bg-slate-800/40 bg-slate-50 dark:border-slate-700/40 border-slate-200 border px-4 py-3 space-y-1">
        <p className="text-xs font-semibold dark:text-slate-300 text-slate-600 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" aria-hidden="true" />
          How this works on the review page
        </p>
        <p className="text-xs dark:text-slate-500 text-slate-400 leading-relaxed">
          Service Tags appear as &quot;Pick exactly 1&quot; — the customer chooses which service they used.
          Category Tags appear as &quot;Pick at least 1&quot; — for qualities like friendliness, ambience, value.
          Both are woven into the AI-generated review text.
        </p>
      </div>
    </div>
  )
}
