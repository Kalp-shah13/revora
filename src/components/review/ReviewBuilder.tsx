'use client'

/**
 * ReviewBuilder — matches the zeusinfinityservices reference design.
 *
 * Step 1 — 2-col grid tag pills (Service + Categories)
 * Step 2 — Slider (1 card at a time, auto-advances every 8s) + editable textarea
 * Step 3 — Copy & Open Google
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { cn, copyToClipboard } from '@/lib/utils'
import { Loader2, Copy, Check, ChevronRight, ChevronLeft, ExternalLink } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tag { id: string; label: string }

interface ReviewBuilderProps {
  businessId: string
  businessName: string
  googleReviewLink: string
  tags: Tag[]
  initialRating?: number
  onComplete: (chosenText: string) => void
}

// ─── Default tags ─────────────────────────────────────────────────────────────

const DEFAULT_SERVICE_TAGS: Tag[] = [
  { id: '__service',  label: 'Service'  },
  { id: '__product',  label: 'Product'  },
]

const DEFAULT_CATEGORY_TAGS: Tag[] = [
  { id: '__people',    label: 'Good People'             },
  { id: '__exp',       label: 'Great Experience'        },
  { id: '__place',     label: 'Good Place'              },
  { id: '__quality',   label: 'Premium Quality'         },
  { id: '__trust',     label: 'Trustworthy'             },
  { id: '__reliable',  label: 'Reliable'                },
  { id: '__work',      label: 'Work Completed Successfully' },
  { id: '__ontime',    label: 'On-Time Delivery'        },
  { id: '__service2',  label: 'Reliable Service'        },
  { id: '__team',      label: 'Professional Team'       },
]

const STYLE_BADGES = [
  { icon: '', label: 'Short & Punchy', tag: 'Short' },
  { icon: '', label: 'Balanced & Natural', tag: 'Medium' },
  { icon: '', label: 'Detailed & In-depth', tag: 'Detailed' },
]

// STATIC FALLBACK VARIANTS COMMENTED OUT PER USER REQUEST (DIRECT GOOGLE GEMINI API ONLY):
// const FALLBACK_VARIANTS_POSITIVE = [
//   "Smooth visit from start to finish—the team was attentive and the quality was top notch.",
//   "Really solid place with standout service. Felt well looked after throughout, and the attention to detail made a big difference.",
//   "Had an outstanding experience from beginning to end. The team went above and beyond with genuine professionalism and care. Easily a 5-star visit and will be returning regularly.",
// ]
// 
// const FALLBACK_VARIANTS_MIXED = [
//   "Decent visit overall, but there were a few inconsistent areas that could be improved.",
//   "The service had potential and staff were polite, but we encountered noticeable hiccups. Hope to see better consistency on future visits.",
//   "Visited hoping for a standout experience, but left feeling somewhat conflicted. While the initial service was fine, delays took away from the visit. Hope management makes the necessary adjustments.",
// ]
// 
// const FALLBACK_VARIANTS_CRITICAL = [
//   "Disappointed with the visit—the service fell well short of expectations.",
//   "Ran into multiple problems during my visit that were not handled properly. Needs serious attention and better management oversight.",
//   "Very frustrating experience with significant delays and poor communication. The service did not meet basic standards, and immediate operational improvements are needed.",
// ]
// 
// function getFallbackVariants(rating: number): string[] {
//   if (rating >= 4) return FALLBACK_VARIANTS_POSITIVE
//   if (rating === 3) return FALLBACK_VARIANTS_MIXED
//   return FALLBACK_VARIANTS_CRITICAL
// }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitTags(tags: Tag[]): { serviceTags: Tag[]; categoryTags: Tag[] } {
  // Use tag_type field if present (from DB), otherwise fall back to position
  const typed = tags as Array<Tag & { tag_type?: string }>
  const serviceByType  = typed.filter(t => t.tag_type === 'service')
  const categoryByType = typed.filter(t => t.tag_type === 'category')

  // If tags have proper tag_type set, use them directly
  if (serviceByType.length > 0 || categoryByType.length > 0) {
    return {
      serviceTags:  serviceByType.length > 0 ? serviceByType  : DEFAULT_SERVICE_TAGS,
      categoryTags: categoryByType.length > 0 ? categoryByType : DEFAULT_CATEGORY_TAGS,
    }
  }

  // Legacy fallback: no tag_type set — split by position
  if (tags.length === 0) return { serviceTags: DEFAULT_SERVICE_TAGS, categoryTags: DEFAULT_CATEGORY_TAGS }
  if (tags.length === 1) return { serviceTags: tags, categoryTags: DEFAULT_CATEGORY_TAGS }
  return {
    serviceTags:  tags.slice(0, 2),
    categoryTags: tags.slice(2).length > 0 ? tags.slice(2) : DEFAULT_CATEGORY_TAGS,
  }
}

function getClientSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let sid = sessionStorage.getItem('revora_client_session_id') || sessionStorage.getItem('gleam_client_session_id')
    if (!sid) {
      sid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      sessionStorage.setItem('revora_client_session_id', sid)
    }
    return sid
  } catch {
    return ''
  }
}

// ─── StepHeader ───────────────────────────────────────────────────────────────

function StepHeader({ number, title, subtitle, active, done }: {
  number: number; title: string; subtitle: string; active: boolean; done: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
        done   ? 'bg-green-500 !text-white'
               : active ? 'bg-blue-600 !text-white'
               : 'bg-slate-200 text-slate-400'
      )} aria-hidden="true">
        {done ? <Check className="w-3.5 h-3.5" /> : number}
      </div>
      <div>
        <p className={cn('font-bold text-base leading-tight', active || done ? 'text-slate-900' : 'text-slate-400')}>
          {title}
        </p>
        <p className={cn('text-xs mt-0.5 leading-snug', active || done ? 'text-slate-500' : 'text-slate-300')}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

// ─── TagPill — 2-col grid style matching reference ────────────────────────────

function TagPill({ label, selected, onClick }: {
  label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'w-full text-center px-2.5 py-2 rounded-lg text-xs font-medium border transition-all duration-150 leading-snug',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        selected
          ? 'bg-blue-600 !text-white border-blue-600 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]'
      )}
    >
      {label}
    </button>
  )
}

// ─── ReviewCard (used inside slider) ─────────────────────────────────────────

function ReviewCard({ text, index, selected, onSelect, visible }: {
  text: string; index: number; selected: boolean; onSelect: () => void; visible: boolean
}) {
  const badge = STYLE_BADGES[index] ?? { icon: '', label: `Option ${index + 1}`, tag: `Option ${index + 1}` }
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Select review option ${index + 1}`}
      className={cn(
        'w-full text-left rounded-2xl border-2 p-5 transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-400'
          : 'border-slate-200 bg-white hover:border-blue-200',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6',
      )}
      style={{ transition: 'opacity 0.35s ease, transform 0.35s ease' }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
          <span>{badge.icon}</span>
          <span>{badge.label}</span>
        </span>
        <span className="text-[11px] text-slate-400 font-medium">Option {index + 1} of 3</span>
      </div>
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
          selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
        )} aria-hidden="true">
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
          {selected && (
            <p className="text-xs text-blue-600 font-semibold mt-2.5 flex items-center gap-1">
              <Check className="h-3 w-3" />Selected
            </p>
          )}
          {!selected && (
            <p className="text-xs text-slate-400 mt-2.5">Tap to select</p>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── ReviewSlider ─────────────────────────────────────────────────────────────

function ReviewSlider({ variants, selectedVariantIndex, onSelect }: {
  variants: string[]
  selectedVariantIndex: number | null
  onSelect: (i: number) => void
}) {
  const [active,   setActive]   = useState(0)
  const [visible,  setVisible]  = useState(true)
  const [progress, setProgress] = useState(0)
  const autoRef  = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const progRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchX   = useRef<number | null>(null)
  const total    = variants.length
  const DURATION = 9000

  const clearTimers = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current)
    if (progRef.current) clearInterval(progRef.current)
  }, [])

  const startAuto = useCallback(() => {
    clearTimers()
    setProgress(0)
    const tick = DURATION / 100
    progRef.current = setInterval(() => setProgress(p => Math.min(p + 1, 100)), tick)
    autoRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => { setActive(p => (p + 1) % total); setVisible(true) }, 350)
    }, DURATION)
  }, [total, clearTimers])

  useEffect(() => { if (variants.length > 0) startAuto(); return clearTimers }, [variants, startAuto, clearTimers])
  useEffect(() => { startAuto() }, [active, startAuto])

  function goTo(index: number) {
    if (index === active) return
    setVisible(false)
    setTimeout(() => { setActive(index); setVisible(true) }, 350)
  }
  function goPrev() { goTo((active - 1 + total) % total) }
  function goNext() { goTo((active + 1) % total) }

  return (
    <div className="space-y-3">
      {/* 3-Tab Style Quick Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
        {variants.slice(0, 3).map((_, i) => {
          const badge = STYLE_BADGES[i] ?? { icon: '', tag: `Opt ${i + 1}` }
          const isCurrent = i === active
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'py-2 px-1 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5',
                isCurrent
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <span>{badge.icon}</span>
              <span className="truncate">{badge.tag}</span>
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400 rounded-full"
          style={{ width: `${progress}%`, transition: progress === 0 ? 'none' : `width ${DURATION / 100}ms linear` }}
        />
      </div>

      {/* Card with arrows */}
      <div className="relative"
        onTouchStart={e => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (touchX.current === null) return
          const diff = touchX.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev()
          touchX.current = null
        }}
      >
        {total > 1 && (
          <button onClick={goPrev} aria-label="Previous"
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
        )}
        <div className="px-7">
          <ReviewCard
            key={active} text={variants[active]} index={active}
            selected={selectedVariantIndex === active}
            onSelect={() => onSelect(active)} visible={visible}
          />
        </div>
        {total > 1 && (
          <button onClick={goNext} aria-label="Next"
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        )}
      </div>
      <p className="text-center text-xs text-slate-400">Tap a style above or swipe · auto-advances</p>
    </div>
  )
}

// ─── Main ReviewBuilder ───────────────────────────────────────────────────────

export default function ReviewBuilder({
  businessId, businessName, googleReviewLink, tags, initialRating = 5, onComplete,
}: ReviewBuilderProps) {
  const { serviceTags, categoryTags } = splitTags(tags)
  const isPositive = initialRating >= 4

  const [selectedService,    setSelectedService]    = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [step2Active,        setStep2Active]        = useState(false)
  const [isGenerating,       setIsGenerating]       = useState(false)
  const [variants,           setVariants]           = useState<string[]>([])
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)
  const [editedText,         setEditedText]         = useState('')
  const [generatedOnce,      setGeneratedOnce]      = useState(false)
  const [step3Active,        setStep3Active]        = useState(false)
  const [opened,             setOpened]             = useState(false)
  const [contactInfo,        setContactInfo]        = useState('')
  const [isSubmitting,       setIsSubmitting]       = useState(false)
  const [justCopied,         setJustCopied]         = useState(false)
  const [genError,           setGenError]           = useState<string | null>(null)
  const [customerNote,       setCustomerNote]       = useState('')

  const step2Ref = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)

  const step1Done = selectedService !== null && selectedCategories.length > 0
  const step2Done = step3Active && editedText.trim().length > 0

  useEffect(() => { if (step1Done && !step2Active) setStep2Active(true) }, [step1Done, step2Active])
  useEffect(() => {
    if (step2Active && step2Ref.current)
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }, [step2Active])
  useEffect(() => {
    if (step3Active && step3Ref.current)
      setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }, [step3Active])

  function handleSelectVariant(i: number) {
    setSelectedVariantIdx(i)
    setEditedText(variants[i] ?? '')
    if (!step3Active) setStep3Active(true)
  }

  const generateReviews = useCallback(async () => {
    if (!step1Done) return
    setIsGenerating(true)
    setGenError(null)
    setSelectedVariantIdx(null)
    setEditedText('')
    setStep3Active(false)

    const serviceLabel    = serviceTags.find(t => t.id === selectedService)?.label
    const categoryLabels  = categoryTags.filter(t => selectedCategories.includes(t.id)).map(t => t.label)
    const allTagLabels    = [serviceLabel, ...categoryLabels].filter(Boolean) as string[]
    // STATIC FALLBACK COMMENTED OUT PER USER REQUEST (DIRECT GOOGLE GEMINI API ONLY):
    // const fallbackForRating = getFallbackVariants(initialRating)

    try {
      const res  = await fetch('/api/review/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-session-id': getClientSessionId(),
        },
        body: JSON.stringify({
          business_id: businessId,
          business_name: businessName,
          selected_tags: allTagLabels,
          rating: initialRating,
          customer_notes: customerNote.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        throw new Error(data.message || 'You have generated several review options recently. Please select one of your drafts or wait a couple of minutes.')
      }
      if (!res.ok || !data.data?.variants || !Array.isArray(data.data.variants) || data.data.variants.length < 3) {
        throw new Error(data.message || 'Failed to generate reviews via Google Gemini API')
      }
      const fetched: string[] = data.data.variants
      setVariants([fetched[0], fetched[1], fetched[2]])
    } catch (err: any) {
      console.error('Google Gemini review generation error:', err)
      setGenError(err.message || 'Unable to generate reviews from Google Gemini API.')
    } finally {
      setIsGenerating(false)
      setGeneratedOnce(true)
    }
  }, [step1Done, selectedService, selectedCategories, businessId, businessName, serviceTags, categoryTags, initialRating, customerNote])

  useEffect(() => {
    if (step2Active && !generatedOnce && !isGenerating) generateReviews()
  }, [step2Active, generatedOnce, isGenerating, generateReviews])

  async function handleManualCopy() {
    const text = editedText.trim()
    if (!text) return
    const ok = await copyToClipboard(text)
    if (ok) {
      setJustCopied(true)
      setTimeout(() => setJustCopied(false), 2500)
    }
  }

  async function handleCopyAndOpen() {
    const text = editedText.trim()
    if (!text) return
    await copyToClipboard(text)
    setJustCopied(true)
    setOpened(true)

    const serviceLabel   = serviceTags.find(t => t.id === selectedService)?.label
    const categoryLabels = categoryTags.filter(t => selectedCategories.includes(t.id)).map(t => t.label)

    fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId, rating: initialRating,
        selected_tags: [serviceLabel, ...categoryLabels].filter(Boolean),
        ai_variant_chosen: text, redirected_to_google: true,
      }),
    }).catch(() => {})

    window.open(googleReviewLink, '_blank', 'noopener,noreferrer')
    // Keep user on page so they can re-copy or re-open Google without premature screen change
  }

  async function handleSubmitPrivateFeedback() {
    const text = editedText.trim()
    if (!text) return
    setIsSubmitting(true)

    const serviceLabel   = serviceTags.find(t => t.id === selectedService)?.label
    const categoryLabels = categoryTags.filter(t => selectedCategories.includes(t.id)).map(t => t.label)

    try {
      await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          rating: initialRating,
          selected_tags: [serviceLabel, ...categoryLabels].filter(Boolean),
          message: text,
          contact_info: contactInfo.trim() || undefined,
          ai_variant_chosen: text,
          redirected_to_google: false,
        }),
      })
    } catch { /* silent */ }
    finally {
      setIsSubmitting(false)
      setOpened(true)
      onComplete(text)
    }
  }

  async function handlePostToGoogleInstead() {
    const text = editedText.trim()
    if (!text) return
    try { await copyToClipboard(text) } catch { /* silent */ }

    setOpened(true)
    setJustCopied(true)

    const serviceLabel   = serviceTags.find(t => t.id === selectedService)?.label
    const categoryLabels = categoryTags.filter(t => selectedCategories.includes(t.id)).map(t => t.label)

    fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        rating: initialRating,
        selected_tags: [serviceLabel, ...categoryLabels].filter(Boolean),
        message: text,
        ai_variant_chosen: text,
        redirected_to_google: true,
      }),
    }).catch(() => {})

    window.open(googleReviewLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4">

      {/* ══ STEP 1 ══════════════════════════════════════════════════════ */}
      <div className={cn(
        'rounded-3xl border-2 bg-white p-5 space-y-5 transition-all duration-200',
        step1Done ? 'border-green-300' : 'border-slate-200 shadow-sm'
      )} aria-label="Step 1: Select tags">

        <StepHeader
          number={1}
          title={isPositive ? "What did you love?" : "What was your experience?"}
          subtitle={
            isPositive
              ? "Pick ONE Service Tag and AT LEAST ONE Category Tag."
              : "Pick your service and any areas where you caught a problem."
          }
          active={!step1Done}
          done={step1Done}
        />

        {/* Service — 2-col grid */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">
            Service <span className="font-normal text-slate-400">(Pick exactly 1)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {serviceTags.map(tag => (
              <TagPill key={tag.id} label={tag.label}
                selected={selectedService === tag.id}
                onClick={() => setSelectedService(p => p === tag.id ? null : tag.id)}
              />
            ))}
          </div>
        </div>

        {/* Categories — 2-col grid */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">
            Categories <span className="font-normal text-slate-400">(Pick at least 1)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {categoryTags.map(tag => {
              const sel = selectedCategories.includes(tag.id)
              return (
                <TagPill key={tag.id} label={tag.label} selected={sel}
                  onClick={() => setSelectedCategories(p => sel ? p.filter(id => id !== tag.id) : [...p, tag.id])}
                />
              )
            })}
          </div>
        </div>

        {/* Optional Custom Detail for Grounding */}
        <div className="space-y-1.5 pt-1">
          <label htmlFor="customer-note-input" className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Any specific detail to mention?</span>
            <span className="font-normal text-slate-400">Optional</span>
          </label>
          <input
            id="customer-note-input"
            type="text"
            value={customerNote}
            onChange={e => setCustomerNote(e.target.value)}
            placeholder="e.g. Dr. Joe was very gentle, spotless clinic..."
            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 text-slate-700 transition-all placeholder:text-slate-400"
            maxLength={140}
          />
        </div>
      </div>

      {/* ══ STEP 2 ══════════════════════════════════════════════════════ */}
      <div
        ref={step2Ref}
        className={cn(
          'rounded-3xl border-2 bg-white p-5 space-y-4 transition-all duration-200',
          !step2Active && 'opacity-50 pointer-events-none select-none',
          step2Done ? 'border-green-300' : step2Active ? 'border-slate-200 shadow-sm' : 'border-slate-100'
        )}
        aria-label="Step 2: Write your review"
      >
        <StepHeader
          number={2}
          title={isPositive ? "Write your review" : "Review your feedback"}
          subtitle={
            isPositive
              ? "Tap any draft below to copy it here. Tweak the wording if you want, then continue to Google."
              : "Here is a draft based on the issues you reported. Tweak the wording to tell us what happened."
          }
          active={step2Active && !step2Done}
          done={step2Done}
        />

        {/* Generating skeleton */}
        {isGenerating && (
          <div className="space-y-3" aria-busy="true">
            {[0,1].map(i => (
              <div key={i} className="rounded-2xl border-2 border-slate-100 p-5 space-y-2 animate-pulse">
                <div className="h-3 bg-slate-100 rounded-full w-full" />
                <div className="h-3 bg-slate-100 rounded-full w-5/6" />
                <div className="h-3 bg-slate-100 rounded-full w-4/6" />
              </div>
            ))}
            <div className="flex items-center gap-2 justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-xs text-slate-400">Crafting 3 personalized reviews with Google Gemini…</span>
            </div>
          </div>
        )}

        {/* Error / Retry state if Gemini call fails */}
        {!isGenerating && step2Active && variants.length === 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center space-y-2">
            <p className="text-xs font-semibold text-red-600">
              {genError || "Could not generate reviews via Google Gemini."}
            </p>
            <p className="text-xs text-red-500">
              Static fallbacks are disabled. Please try again.
            </p>
            <button
              type="button"
              onClick={generateReviews}
              className="text-xs font-semibold px-3 py-1.5 bg-white text-red-700 rounded-lg border border-red-300 hover:bg-red-100 transition-all shadow-sm"
            >
              Retry Generation
            </button>
          </div>
        )}

        {/* Traffic limit / Regeneration notice when existing variants are present */}
        {!isGenerating && step2Active && variants.length > 0 && genError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-center space-y-1">
            <p className="text-xs font-semibold text-amber-800">
              {genError}
            </p>
            <p className="text-[11px] text-amber-600">
              You can still choose or tweak any of your existing drafts below.
            </p>
          </div>
        )}

        {/* Slider */}
        {!isGenerating && step2Active && variants.length > 0 && (
          <ReviewSlider
            variants={variants}
            selectedVariantIndex={selectedVariantIdx}
            onSelect={handleSelectVariant}
          />
        )}

        {/* Editable textarea */}
        {!isGenerating && selectedVariantIdx !== null && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Edit below if you want to tweak the wording:</p>
            <textarea
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              rows={5}
              aria-label="Edit your review"
              placeholder="Edit your chosen review here, or write from scratch if you prefer."
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              maxLength={1200}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{editedText.length}/1200</p>
              {generatedOnce && (
                <button type="button" onClick={generateReviews} disabled={isGenerating}
                  className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2 disabled:opacity-40">
                  Regenerate reviews
                </button>
              )}
            </div>
          </div>
        )}

        {/* Placeholder when not yet active */}
        {!step2Active && (
          <p className="text-sm text-slate-400 text-center py-2">
            Your review options will show here once step 1 is done.
          </p>
        )}

        {/* Regenerate before selection */}
        {!isGenerating && generatedOnce && selectedVariantIdx === null && variants.length > 0 && (
          <div className="flex justify-end">
            <button type="button" onClick={generateReviews}
              className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2">
              Regenerate reviews
            </button>
          </div>
        )}
      </div>

      {/* ══ STEP 3 ══════════════════════════════════════════════════════ */}
      <div
        ref={step3Ref}
        className={cn(
          'rounded-3xl border-2 bg-white p-5 space-y-4 transition-all duration-200',
          !step3Active && 'opacity-50 pointer-events-none select-none',
          step3Active ? 'border-slate-200 shadow-sm' : 'border-slate-100'
        )}
        aria-label={isPositive ? "Step 3: Post to Google" : "Step 3: Send to Management"}
      >
        <StepHeader
          number={3}
          title={isPositive ? "Post to Google" : "Send to Management"}
          subtitle={
            isPositive
              ? "One tap. Your review gets copied then opens Google."
              : "Send this directly to the team so they can address the problem."
          }
          active={step3Active && !opened}
          done={opened}
        />

        {step3Active && (
          <div className="space-y-3">
            {isPositive ? (
              <>
                {/* Visual Step Guide */}
                <div className="rounded-2xl bg-blue-50/80 border border-blue-200/80 p-3.5 space-y-2 text-xs text-blue-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-blue-900 text-sm">
                      <Copy className="h-4 w-4 text-blue-600" /> How to Post in 3 Seconds:
                    </span>
                    {justCopied && (
                      <span className="bg-green-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in-up">
                        <Check className="h-3 w-3" /> Copied!
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-slate-700">
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                      <span>Tap <strong>5 Stars</strong> on Google</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-blue-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                      <span>Long-press &amp; tap <strong>Paste</strong></span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA button */}
                <button
                  onClick={handleCopyAndOpen}
                  disabled={!editedText.trim()}
                  className={cn(
                    'w-full h-14 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg',
                    justCopied || opened
                      ? 'bg-green-600 text-white shadow-green-600/20 active:scale-[0.98]'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/25 active:scale-[0.98]',
                    !editedText.trim() && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label="Copy review and open Google"
                >
                  {justCopied || opened ? (
                    <><Check className="h-5 w-5" />Copied! Open Google Review <ExternalLink className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Copy &amp; Open Google Review <ChevronRight className="h-5 w-5" /></>
                  )}
                </button>

                {/* Manual copy button for mobile reassurance */}
                <div className="flex items-center justify-center gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={handleManualCopy}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-blue-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {justCopied ? 'Text copied to clipboard!' : 'Or tap here to only copy text'}
                  </button>
                </div>

                {opened && (
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4 space-y-3 text-left animate-fade-in-up mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-green-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-green-600" />
                        Copied to Clipboard!
                      </span>
                      <span className="text-[11px] bg-green-200/80 text-green-900 font-semibold px-2 py-0.5 rounded-full">
                        Google Tab Opened
                      </span>
                    </div>
                    <p className="text-xs text-green-900 leading-relaxed">
                      We opened Google in a new tab. Select <strong>5 Stars</strong>, long-press the text box to <strong>Paste</strong> your review, and tap <strong>Post</strong>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => window.open(googleReviewLink, '_blank', 'noopener,noreferrer')}
                        className="flex-1 h-10 rounded-xl bg-green-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all shadow-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Re-open Google
                      </button>
                      <button
                        type="button"
                        onClick={handleManualCopy}
                        className="flex-1 h-10 rounded-xl bg-white border border-green-300 text-green-800 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-green-100 transition-all shadow-sm"
                      >
                        <Copy className="h-3.5 w-3.5" /> Re-copy Text
                      </button>
                    </div>
                    <div className="pt-2 border-t border-green-200/60 flex items-center justify-between text-[11px] text-green-700">
                      <span>Finished posting on Google?</span>
                      <button
                        type="button"
                        onClick={() => onComplete(editedText.trim())}
                        className="font-semibold text-green-800 underline underline-offset-2 hover:text-green-950 transition-colors"
                      >
                        I finished posting →
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Info banner for <= 3 stars */}
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 leading-snug">
                  <strong>Private Team Feedback:</strong> Your feedback will be delivered directly to the manager&apos;s inbox so they can investigate and make things right.
                </div>

                {/* Optional contact info */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Contact details (optional — if you&apos;d like management to reach back out)
                  </label>
                  <input
                    type="text"
                    placeholder="Email or phone number (optional)"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmitPrivateFeedback}
                  disabled={!editedText.trim() || isSubmitting || opened}
                  className={cn(
                    'w-full h-14 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2',
                    opened
                      ? 'bg-green-500 !text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-[0.98]',
                    (!editedText.trim() || isSubmitting) && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label="Send feedback to management"
                >
                  {opened ? (
                    <><Check className="h-5 w-5" />Feedback Delivered!</>
                  ) : isSubmitting ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />Sending feedback…</>
                  ) : (
                    <>Send to Management <ChevronRight className="h-5 w-5" /></>
                  )}
                </button>

                {/* Secondary link to post on Google */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handlePostToGoogleInstead}
                    className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 inline-flex items-center gap-1 mx-auto"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Prefer to copy and post publicly on Google instead?
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!step3Active && (
          <p className="text-sm text-slate-400 text-center py-1">
            Select a review draft above to unlock this step.
          </p>
        )}
      </div>

    </div>
  )
}
