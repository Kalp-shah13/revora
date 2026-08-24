'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, RefreshCw, X } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { generateSlug } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Owner {
  id: string
  email: string
  full_name: string | null
}

interface CreateBusinessModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const inputCls = cn(
  'w-full h-11 px-4 rounded-xl border text-sm',
  'dark:bg-slate-950/35 bg-white/70',
  'dark:text-white text-slate-900',
  'dark:border-white/10 border-white/70',
  'dark:placeholder:text-slate-500 placeholder:text-slate-400',
  'outline-none focus:ring-2 dark:focus:ring-blue-500/30 focus:ring-blue-500/20',
  'dark:focus:border-blue-500/50 focus:border-blue-400',
  'shadow-sm backdrop-blur-md',
  'transition-all duration-200 disabled:opacity-50'
)

const labelCls = 'block text-xs font-semibold uppercase tracking-wide dark:text-slate-400 text-slate-500 mb-1.5'

export default function CreateBusinessModal({ open, onClose, onCreated }: CreateBusinessModalProps) {
  const [name,         setName]         = useState('')
  const [slug,         setSlug]         = useState('')
  const [googleLink,   setGoogleLink]   = useState('')
  const [plan,         setPlan]         = useState<'free' | 'pro' | 'enterprise'>('free')
  const [ownerId,      setOwnerId]      = useState('')
  const [owners,       setOwners]       = useState<Owner[]>([])
  const [loadingOwners,setLoadingOwners]= useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => { if (name) setSlug(generateSlug(name)) }, [name])

  useEffect(() => {
    if (!open) return
    setLoadingOwners(true)
    fetch('/api/admin/owners')
      .then(r => r.json())
      .then(d => setOwners(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingOwners(false))
  }, [open])

  function reset() {
    setName(''); setSlug(''); setGoogleLink('')
    setPlan('free'); setOwnerId(''); setError(null)
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim())       { setError('Business name is required'); return }
    if (!slug.trim())       { setError('Slug is required'); return }
    if (!googleLink.trim()) { setError('Google review link is required'); return }
    if (!ownerId)           { setError('Please select an owner'); return }

    setIsSubmitting(true)
    try {
      const res  = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), slug: slug.trim(),
          google_review_link: googleLink.trim(), plan, owner_id: ownerId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create business')
      reset(); onCreated(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 p-4 backdrop-blur-sm dark:bg-transparent animate-fade-in-up"
      onMouseDown={event => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
        <div
          className={cn(
            'w-full max-w-md rounded-2xl backdrop-blur-2xl',
            'dark:bg-slate-950/58 bg-white/[0.78]',
            'border dark:border-white/10 border-white/80',
            'shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_70px_rgba(59,130,246,0.18),0_0_34px_rgba(168,85,247,0.12)]',
            'animate-fade-in-up'
          )}
          onMouseDown={event => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Create Business"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b dark:border-white/10 border-white/70">
            <div>
              <h2 className="text-base font-bold dark:text-white text-slate-900">Create Business</h2>
              <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
                Add a new client business to the platform
              </p>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center
                dark:text-slate-400 text-slate-500
                dark:hover:bg-white/10 hover:bg-white/60
                transition-all duration-200"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="biz-name" className={labelCls}>
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                id="biz-name"
                placeholder="Joe's Cafe"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSubmitting}
                required
                className={inputCls}
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="biz-slug" className={labelCls}>
                Slug <span className="text-red-400">*</span>
                <span className="ml-1 normal-case font-normal dark:text-slate-500 text-slate-400">
                  (used in review URL)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  id="biz-slug"
                  placeholder="joes-cafe"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  disabled={isSubmitting}
                  required
                  className={cn(inputCls, 'font-mono')}
                />
                <button
                  type="button"
                  onClick={() => setSlug(generateSlug(name))}
                  disabled={!name || isSubmitting}
                  className="h-11 w-11 rounded-xl border dark:border-slate-700/50 border-slate-200
                    dark:text-slate-400 text-slate-500
                    dark:hover:bg-white/10 hover:bg-white/60
                    disabled:opacity-50 transition-all duration-200 shrink-0 flex items-center justify-center"
                  aria-label="Regenerate slug"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs dark:text-slate-500 text-slate-400 mt-1.5">
                Preview: /review/{slug || '…'}
              </p>
            </div>

            {/* Google link */}
            <div>
              <label htmlFor="biz-google" className={labelCls}>
                Google Review Link <span className="text-red-400">*</span>
              </label>
              <input
                id="biz-google"
                type="url"
                placeholder="https://g.page/r/your-business/review"
                value={googleLink}
                onChange={e => setGoogleLink(e.target.value)}
                disabled={isSubmitting}
                required
                className={inputCls}
              />
            </div>

            {/* Plan + Owner — side by side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="biz-plan" className={labelCls}>Plan</label>
                <Select value={plan} onValueChange={v => setPlan(v as typeof plan)} disabled={isSubmitting}>
                  <SelectTrigger id="biz-plan" className="h-11 bg-white/70 dark:bg-slate-950/35 border-white/70 dark:border-white/10 dark:text-white rounded-xl backdrop-blur-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-700/60">
                    {['free','pro','enterprise'].map(p => (
                      <SelectItem key={p} value={p} className="capitalize dark:text-slate-200 dark:focus:bg-slate-800">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="biz-owner" className={labelCls}>
                  Owner <span className="text-red-400">*</span>
                </label>
                <Select value={ownerId} onValueChange={v => setOwnerId(v ?? '')} disabled={isSubmitting || loadingOwners}>
                  <SelectTrigger id="biz-owner" className="h-11 bg-white/70 dark:bg-slate-950/35 border-white/70 dark:border-white/10 dark:text-white rounded-xl backdrop-blur-md">
                    <SelectValue placeholder={loadingOwners ? 'Loading…' : 'Select owner'} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-700/60">
                    {owners.map(o => (
                      <SelectItem key={o.id} value={o.id} className="dark:text-slate-200 dark:focus:bg-slate-800">
                        {o.full_name || o.email}
                        {o.full_name && <span className="dark:text-slate-500 text-slate-400 ml-1 text-xs">({o.email})</span>}
                      </SelectItem>
                    ))}
                    {owners.length === 0 && !loadingOwners && (
                      <div className="px-2 py-4 text-center text-xs dark:text-slate-400 text-slate-500">
                        No business owners found.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl dark:bg-red-500/10 bg-red-50
                  dark:border-red-500/30 border-red-200 border px-3.5 py-3
                  text-sm dark:text-red-300 text-red-700 animate-shake"
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl border font-semibold text-sm
                  dark:border-white/10 border-white/70
                  dark:text-slate-300 text-slate-600
                  dark:hover:bg-white/10 hover:bg-white/60
                  transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex-1 h-11 rounded-xl font-semibold text-sm btn-primary-solid flex items-center justify-center gap-2',
                  'transition-all duration-200 active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Creating…</>
                ) : (
                  <><Plus className="h-4 w-4" aria-hidden="true" />Create Business</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}
