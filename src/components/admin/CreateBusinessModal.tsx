'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  X,
  Check,
  ExternalLink,
  AlertCircle,
  Globe,
  User,
  Shield,
  Sparkles,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateSlug } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { validateGoogleReviewLink } from '@/lib/google-link'

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
  'w-full h-11 px-3.5 rounded-xl text-sm font-medium transition-all duration-200',
  'bg-slate-50 dark:bg-slate-950/60',
  'border border-slate-300 dark:border-slate-800',
  'text-slate-900 dark:text-white',
  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
  'hover:border-slate-400 dark:hover:border-slate-700',
  'focus:bg-white dark:focus:bg-slate-950',
  'focus:border-blue-600 dark:focus:border-blue-500',
  'focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:focus:ring-blue-500/20',
  'disabled:opacity-50 disabled:cursor-not-allowed shadow-xs'
)

const labelCls = 'block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5'

export default function CreateBusinessModal({ open, onClose, onCreated }: CreateBusinessModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [googleLink, setGoogleLink] = useState('')
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('free')
  const [ownerMode, setOwnerMode] = useState<'existing' | 'new'>('new')
  const [ownerId, setOwnerId] = useState('')
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const [newOwnerPassword, setNewOwnerPassword] = useState('')
  const [owners, setOwners] = useState<Owner[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (name) setSlug(generateSlug(name))
  }, [name])

  useEffect(() => {
    if (!open) return
    setLoadingOwners(true)
    fetch('/api/admin/owners')
      .then(r => r.json())
      .then(d => {
        const list = d.data ?? []
        setOwners(list)
        if (list.length > 0) {
          setOwnerId(list[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOwners(false))
  }, [open])

  function reset() {
    setName('')
    setSlug('')
    setGoogleLink('')
    setPlan('free')
    setOwnerId('')
    setError(null)
    setOwnerMode('new')
    setNewOwnerName('')
    setNewOwnerEmail('')
    setNewOwnerPassword('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Business name is required')
      return
    }
    if (!slug.trim()) {
      setError('Slug is required')
      return
    }
    if (!googleLink.trim()) {
      setError('Google review link is required')
      return
    }

    const googleValidation = validateGoogleReviewLink(googleLink)
    if (!googleValidation.isValid) {
      setError(googleValidation.error || 'Please provide a valid Google review link or Place ID')
      return
    }

    if (ownerMode === 'existing' && !ownerId) {
      setError('Please select an owner')
      return
    }
    if (ownerMode === 'new') {
      if (!newOwnerEmail.trim()) {
        setError('Owner email is required')
        return
      }
      if (!newOwnerPassword.trim() || newOwnerPassword.length < 6) {
        setError('Owner password must be at least 6 characters')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim(),
        google_review_link: googleValidation.normalizedUrl || googleLink.trim(),
        plan: plan.toUpperCase(),
      }

      if (ownerMode === 'new') {
        payload.new_owner = {
          email: newOwnerEmail.trim(),
          password: newOwnerPassword,
          full_name: newOwnerName.trim() || undefined,
        }
      } else {
        payload.owner_id = ownerId
      }

      const res = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create business')
      reset()
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  const googleValidation = googleLink.trim() ? validateGoogleReviewLink(googleLink) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 sm:p-6 backdrop-blur-md animate-fade-in-up overflow-y-auto"
      onMouseDown={event => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
      <div
        className={cn(
          'w-full max-w-xl rounded-2xl flex flex-col',
          'bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-800',
          'shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]',
          'animate-fade-in-up my-auto max-h-[92vh] overflow-hidden'
        )}
        onMouseDown={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create Business"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Create New Business
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set up a client business profile, review link, and owner access
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Section 1: Business Profile */}
          <div className="space-y-4">
            {/* Business Name */}
            <div>
              <label htmlFor="biz-name" className={labelCls}>
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="biz-name"
                placeholder="e.g. Joe's Cafe, Dr. Dental Clinic"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSubmitting}
                required
                className={inputCls}
                autoFocus
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="biz-slug" className={cn(labelCls, 'mb-0')}>
                  Review URL Slug <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Custom path for QR code
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 select-none">
                    /review/
                  </span>
                  <input
                    id="biz-slug"
                    placeholder="joes-cafe"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    disabled={isSubmitting}
                    required
                    className={cn(inputCls, 'pl-20 font-mono text-xs sm:text-sm')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSlug(generateSlug(name))}
                  disabled={!name || isSubmitting}
                  className="h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-800
                    bg-slate-50 dark:bg-slate-950/60
                    text-slate-600 dark:text-slate-400
                    hover:text-slate-900 dark:hover:text-white
                    hover:bg-slate-100 dark:hover:bg-slate-800
                    disabled:opacity-40 transition-all shrink-0 flex items-center justify-center gap-1.5 text-xs font-semibold"
                  title="Regenerate slug from business name"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <Globe className="h-3 w-3 text-slate-400" />
                <span>Live URL: <code className="font-mono text-blue-600 dark:text-blue-400">/review/{slug || 'your-slug'}</code></span>
              </p>
            </div>
          </div>

          {/* Section 2: Google Review Destination Card */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/15 space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="biz-google" className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Google Review Link or Place ID <span className="text-red-500">*</span>
              </label>
              {googleValidation?.isValid && googleValidation.normalizedUrl && (
                <button
                  type="button"
                  onClick={() => window.open(googleValidation.normalizedUrl, '_blank', 'noopener,noreferrer')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Test Link
                </button>
              )}
            </div>

            <input
              id="biz-google"
              type="text"
              placeholder="https://search.google.com/local/writereview?placeid=... or ChIJ..."
              value={googleLink}
              onChange={e => setGoogleLink(e.target.value)}
              disabled={isSubmitting}
              required
              className={cn(
                inputCls,
                'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800'
              )}
            />

            {/* Validation Pill */}
            {googleLink.trim().length > 0 && googleValidation && (
              googleValidation.isValid ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    Valid Google {googleValidation.kind === 'place_id' ? 'Place ID (auto-formatted to 5-star write-review link)' : googleValidation.kind === 'shortlink' ? 'Shortlink' : 'Review Link'}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{googleValidation.error}</span>
                </div>
              )
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste your direct review URL, <code className="font-mono text-slate-700 dark:text-slate-300">g.page/r/...</code> shortlink, or Place ID starting with <code className="font-mono text-slate-700 dark:text-slate-300">ChIJ</code>.
            </p>
          </div>

          {/* Section 3: Plan Selector */}
          <div>
            <label htmlFor="biz-plan" className={labelCls}>Subscription Plan</label>
            <Select value={plan} onValueChange={v => setPlan(v as typeof plan)} disabled={isSubmitting}>
              <SelectTrigger
                id="biz-plan"
                className="w-full h-11 px-3.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                {[
                  { id: 'free', label: 'Free Plan', desc: 'Up to 100 QR scans/mo' },
                  { id: 'pro', label: 'Pro Plan', desc: 'Unlimited scans, AI feedback filter' },
                  { id: 'enterprise', label: 'Enterprise Plan', desc: 'Multi-branch, dedicated SLA' },
                ].map(p => (
                  <SelectItem key={p.id} value={p.id} className="py-2 dark:focus:bg-slate-800">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-semibold text-slate-900 dark:text-white capitalize">{p.label}</span>
                      <span className="text-xs text-slate-400">{p.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section 4: Business Owner Section */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Business Owner Account <span className="text-red-500">*</span>
              </span>
              <div className="inline-flex p-1 rounded-xl bg-slate-200/90 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOwnerMode('new')}
                  className={cn(
                    'px-3 py-1 rounded-lg transition-all',
                    ownerMode === 'new'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  + New Owner
                </button>
                <button
                  type="button"
                  onClick={() => setOwnerMode('existing')}
                  className={cn(
                    'px-3 py-1 rounded-lg transition-all',
                    ownerMode === 'existing'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Existing Owner
                </button>
              </div>
            </div>

            {ownerMode === 'new' ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label htmlFor="new-owner-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Owner Full Name
                  </label>
                  <input
                    id="new-owner-name"
                    type="text"
                    placeholder="e.g. Dr. Rajesh Shah"
                    value={newOwnerName}
                    onChange={e => setNewOwnerName(e.target.value)}
                    disabled={isSubmitting}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="new-owner-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Dashboard Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="new-owner-email"
                      type="email"
                      placeholder="doctor@advancedental.com"
                      value={newOwnerEmail}
                      onChange={e => setNewOwnerEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-owner-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Dashboard Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="new-owner-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={newOwnerPassword}
                      onChange={e => setNewOwnerPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      minLength={6}
                      className={inputCls}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Shield className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Owner will log in at <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">/login</code> to view reviews and analytics.</span>
                </p>
              </div>
            ) : (
              <div className="pt-1">
                <label htmlFor="biz-owner" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Registered Owner <span className="text-red-500">*</span>
                </label>
                <Select value={ownerId} onValueChange={v => setOwnerId(v ?? '')} disabled={isSubmitting || loadingOwners}>
                  <SelectTrigger
                    id="biz-owner"
                    className="w-full h-11 px-3.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <SelectValue placeholder={loadingOwners ? 'Loading owners…' : 'Choose an owner'} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {owners.map(o => (
                      <SelectItem key={o.id} value={o.id} className="dark:focus:bg-slate-800 py-2">
                        <span className="font-medium">{o.full_name || o.email}</span>
                        {o.full_name && <span className="text-xs text-slate-400 ml-2">({o.email})</span>}
                      </SelectItem>
                    ))}
                    {owners.length === 0 && !loadingOwners && (
                      <div className="px-3 py-4 text-center text-xs text-slate-500">
                        No registered owners found. Please switch to "+ New Owner".
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3.5 text-xs text-red-700 dark:text-red-300 font-medium animate-shake"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-11 px-5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'h-11 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2',
                'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-95',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating Business…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create Business
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
