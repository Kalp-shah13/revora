'use client'

/**
 * ReviewBuilder — matches the zeusinfinityservices reference design.
 *
 * Step 1 — 2-col grid tag pills (Service + Categories)
 * Step 2 — Slider (1 card at a time, auto-advances every 8s) + editable textarea
 * Step 3 — Copy & Open Google
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
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
  { id: '__service',  label: '🛠️ Service'  },
  { id: '__product',  label: '📦 Product'  },
]

const DEFAULT_CATEGORY_TAGS: Tag[] = [
  { id: '__people',    label: '👥 Good People'             },
  { id: '__exp',       label: '⭐ Great Experience'         },
  { id: '__place',     label: '📍 Good Place'              },
  { id: '__quality',   label: '💎 Premium Quality'         },
  { id: '__trust',     label: '🤝 Trustworthy'             },
  { id: '__reliable',  label: '🎯 Reliable'                },
  { id: '__work',      label: '👏 Work Completed Successfully' },
  { id: '__ontime',    label: '⏳ On-Time Delivery'        },
  { id: '__service2',  label: '🔌 Reliable Service'        },
  { id: '__team',      label: '👍 Professional Team'       },
]

const FALLBACK_VARIANTS = [
  "Came here on a recommendation and it genuinely delivered. Staff were friendly and the whole thing was smooth from the moment I walked in. Would come back no question.",
  "Really solid place. Felt well looked after throughout and everything was handled properly. Glad I found it and will be telling others.",
]

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
        {done ? '✓' : number}
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
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-blue-200',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6',
      )}
      style={{ transition: 'opacity 0.35s ease, transform 0.35s ease' }}
    >
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
            <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
              <Check className="h-3 w-3" />Selected
            </p>
          )}
          {!selected && (
            <p className="text-xs text-slate-400 mt-2">Tap to select</p>
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
  const DURATION = 8000

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
      {/* Counter + dots */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-400 font-medium">Option {active + 1} of {total}</span>
        <div className="flex gap-1.5">
          {variants.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Review ${i + 1}`}
              className={cn('rounded-full transition-all duration-300',
                i === active ? 'w-5 h-2 bg-blue-500' : 'w-2 h-2 bg-slate-300 hover:bg-blue-300'
              )}
            />
          ))}
        </div>
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
      <p className="text-center text-xs text-slate-400">Swipe or use arrows · auto-advances every 8s</p>
    </div>
  )
}

// ─── Main ReviewBuilder ───────────────────────────────────────────────────────

export default function ReviewBuilder({
  businessId, businessName, googleReviewLink, tags, initialRating = 5, onComplete,
}: ReviewBuilderProps) {
  const { serviceTags, categoryTags } = splitTags(tags)

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
    setSelectedVariantIdx(null)
    setEditedText('')
    setStep3Active(false)

    const serviceLabel    = serviceTags.find(t => t.id === selectedService)?.label
    const categoryLabels  = categoryTags.filter(t => selectedCategories.includes(t.id)).map(t => t.label)
    const allTagLabels    = [serviceLabel, ...categoryLabels].filter(Boolean) as string[]

    try {
      const res  = await fetch('/api/review/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, business_name: businessName, selected_tags: allTagLabels }),
      })
      const data = await res.json()
      const fetched: string[] = data.data?.variants ?? FALLBACK_VARIANTS
      setVariants([fetched[0] ?? FALLBACK_VARIANTS[0], fetched[1] ?? FALLBACK_VARIANTS[1]])
    } catch {
      setVariants([FALLBACK_VARIANTS[0], FALLBACK_VARIANTS[1]])
    } finally {
      setIsGenerating(false)
      setGeneratedOnce(true)
    }
  }, [step1Done, selectedService, selectedCategories, businessId, businessName, serviceTags, categoryTags])

  useEffect(() => {
    if (step2Active && !generatedOnce && !isGenerating) generateReviews()
  }, [step2Active, generatedOnce, isGenerating, generateReviews])

  async function handleCopyAndOpen() {
    const text = editedText.trim()
    if (!text) return
    try { await navigator.clipboard.writeText(text) } catch { /* silent */ }

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
    onComplete(text)
  }

  return (
    <div className="space-y-4">

      {/* ══ STEP 1 ══════════════════════════════════════════════════════ */}
      <div className={cn(
        'rounded-3xl border-2 bg-white p-5 space-y-5 transition-all duration-200',
        step1Done ? 'border-green-300' : 'border-slate-200 shadow-sm'
      )} aria-label="Step 1: Select tags">

        <StepHeader number={1} title="What did you love?"
          subtitle="Pick ONE Service Tag and AT LEAST ONE Category Tag."
          active={!step1Done} done={step1Done} />

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
        <StepHeader number={2} title="Write your review"
          subtitle="Tap any draft below to copy it here. Tweak the wording if you want, then continue to Google."
          active={step2Active && !step2Done} done={step2Done} />

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
              <span className="text-xs text-slate-400">Writing two personalised drafts…</span>
            </div>
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
            <p className="text-xs text-slate-500">✏️ Edit below if you want to tweak the wording:</p>
            <textarea
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              rows={4}
              aria-label="Edit your review"
              placeholder="Edit your chosen review here, or write from scratch if you prefer."
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              maxLength={600}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{editedText.length}/600</p>
              {generatedOnce && (
                <button type="button" onClick={generateReviews} disabled={isGenerating}
                  className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2 disabled:opacity-40">
                  Regenerate both
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
        {!isGenerating && generatedOnce && selectedVariantIdx === null && (
          <div className="flex justify-end">
            <button type="button" onClick={generateReviews}
              className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2">
              Regenerate both
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
        aria-label="Step 3: Post to Google"
      >
        <StepHeader number={3} title="Post to Google"
          subtitle="One tap. Your review gets copied then opens Google."
          active={step3Active && !opened} done={opened} />

        {step3Active && (
          <div className="space-y-3">
            {/* Info banner */}
            <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 leading-snug">
              📋 We&apos;ll <strong>copy your review</strong> to clipboard, then open Google Reviews. Just <strong>paste &amp; submit!</strong>
            </div>

            {/* CTA button */}
            <button
              onClick={handleCopyAndOpen}
              disabled={!editedText.trim() || opened}
              className={cn(
                'w-full h-14 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2',
                opened
                  ? 'bg-green-500 !text-white'
                  : 'bg-slate-100 text-slate-500 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98]',
                !editedText.trim() && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="Copy review and open Google"
            >
              {opened ? (
                <><Check className="h-5 w-5" />Copied &amp; Google Opened!</>
              ) : (
                <>Copy &amp; Open Google Review <ChevronRight className="h-5 w-5" /></>
              )}
            </button>

            {opened && (
              <button
                onClick={() => window.open(googleReviewLink, '_blank', 'noopener,noreferrer')}
                className="w-full h-11 rounded-2xl border-2 border-slate-200 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />Open Google Reviews again
              </button>
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
