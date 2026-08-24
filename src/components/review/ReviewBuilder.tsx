'use client'

/**
 * ReviewBuilder — single-page scrollable review flow.
 *
 * Step 1 — Tag selection (Service: pick 1 | Categories: pick ≥1)
 * Step 2 — Pick one of 2 AI-generated drafts, edit freely
 * Step 3 — Copy & Open Google
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Copy, Check, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tag {
  id: string
  label: string
}

interface ReviewBuilderProps {
  businessId: string
  businessName: string
  googleReviewLink: string
  tags: Tag[]
  initialRating?: number
  onComplete: (chosenText: string) => void
}

// ─── Default tags (used when business has none configured) ────────────────────

const DEFAULT_SERVICE_TAGS: Tag[] = [
  { id: '__service', label: '🛠️ Service' },
  { id: '__product', label: '📦 Product' },
]

const DEFAULT_CATEGORY_TAGS: Tag[] = [
  { id: '__friendly', label: '😊 Friendly Staff' },
  { id: '__clean', label: '✨ Clean & Tidy' },
  { id: '__fast', label: '⚡ Fast Service' },
  { id: '__value', label: '💰 Great Value' },
  { id: '__professional', label: '🏆 Professional' },
  { id: '__caring', label: '❤️ Caring' },
]

const FALLBACK_VARIANTS = [
  "Came here on a recommendation and it genuinely delivered. Staff were friendly and the whole thing was smooth from the moment I walked in. Would come back no question.",
  "Really solid place. Felt well looked after throughout and everything was handled properly. Glad I found it and will be telling others.",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitTags(tags: Tag[]): { serviceTags: Tag[]; categoryTags: Tag[] } {
  if (tags.length === 0) {
    return { serviceTags: DEFAULT_SERVICE_TAGS, categoryTags: DEFAULT_CATEGORY_TAGS }
  }
  if (tags.length === 1) {
    return { serviceTags: tags, categoryTags: DEFAULT_CATEGORY_TAGS }
  }
  return {
    serviceTags: tags.slice(0, 2),
    categoryTags: tags.slice(2).length > 0 ? tags.slice(2) : DEFAULT_CATEGORY_TAGS,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({
  number, title, subtitle, active, done,
}: {
  number: number; title: string; subtitle: string; active: boolean; done: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
          done ? 'bg-green-500 text-white' : active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
        )}
        aria-hidden="true"
      >
        {done ? '✓' : number}
      </div>
      <div>
        <p className={cn('font-semibold text-base leading-tight', active || done ? 'text-slate-900' : 'text-slate-400')}>
          {title}
        </p>
        <p className={cn('text-xs mt-0.5', active || done ? 'text-slate-500' : 'text-slate-300')}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function TagPill({
  label, selected, onClick,
}: {
  label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
        selected
          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer'
      )}
    >
      {label}
    </button>
  )
}

/** One selectable review card with radio indicator */
function ReviewCard({
  text, index, selected, onSelect,
}: {
  text: string; index: number; selected: boolean; onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Select review option ${index + 1}`}
      className={cn(
        'w-full text-left rounded-xl border p-4 transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
        selected
          ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-400'
          : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Radio indicator */}
        <div
          className={cn(
            'mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
            selected ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-white'
          )}
          aria-hidden="true"
        >
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
      </div>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReviewBuilder({
  businessId,
  businessName,
  googleReviewLink,
  tags,
  initialRating = 5,
  onComplete,
}: ReviewBuilderProps) {
  const { serviceTags, categoryTags } = splitTags(tags)

  // Step 1
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Step 2
  const [step2Active, setStep2Active] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [variants, setVariants] = useState<string[]>([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null)
  const [editedText, setEditedText] = useState('')
  const [generatedOnce, setGeneratedOnce] = useState(false)

  // Step 3
  const [step3Active, setStep3Active] = useState(false)
  const [copied, setCopied] = useState(false)
  const [opened, setOpened] = useState(false)

  const step2Ref = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)

  // Derived
  const step1Done = selectedService !== null && selectedCategories.length > 0
  const step2Done = step3Active && editedText.trim().length > 0

  // ── Auto-activate step 2 when step 1 is complete ──────────────────────
  useEffect(() => {
    if (step1Done && !step2Active) setStep2Active(true)
  }, [step1Done, step2Active])

  // ── Scroll into view ──────────────────────────────────────────────────
  useEffect(() => {
    if (step2Active && step2Ref.current) {
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }, [step2Active])

  useEffect(() => {
    if (step3Active && step3Ref.current) {
      setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }, [step3Active])

  // ── Select a variant card ─────────────────────────────────────────────
  function handleSelectVariant(index: number) {
    setSelectedVariantIndex(index)
    setEditedText(variants[index] ?? '')
    // Unlock step 3 on first selection
    if (!step3Active) setStep3Active(true)
  }

  // ── Generate 2 reviews ────────────────────────────────────────────────
  const generateReviews = useCallback(async () => {
    if (!step1Done) return
    setIsGenerating(true)
    setSelectedVariantIndex(null)
    setEditedText('')
    setStep3Active(false)

    const serviceLabel = serviceTags.find((t) => t.id === selectedService)?.label
    const categoryLabels = categoryTags
      .filter((t) => selectedCategories.includes(t.id))
      .map((t) => t.label)
    const allTagLabels = [serviceLabel, ...categoryLabels].filter(Boolean) as string[]

    try {
      const res = await fetch('/api/review/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          business_name: businessName,
          selected_tags: allTagLabels,
        }),
      })
      const data = await res.json()
      const fetched: string[] = data.data?.variants ?? FALLBACK_VARIANTS
      // Always show exactly 2
      setVariants([
        fetched[0] ?? FALLBACK_VARIANTS[0],
        fetched[1] ?? FALLBACK_VARIANTS[1],
      ])
    } catch {
      setVariants([FALLBACK_VARIANTS[0], FALLBACK_VARIANTS[1]])
    } finally {
      setIsGenerating(false)
      setGeneratedOnce(true)
    }
  }, [step1Done, selectedService, selectedCategories, businessId, businessName, serviceTags, categoryTags])

  // Auto-generate when step 2 first activates
  useEffect(() => {
    if (step2Active && !generatedOnce && !isGenerating) generateReviews()
  }, [step2Active, generatedOnce, isGenerating, generateReviews])

  // ── Copy & open Google ────────────────────────────────────────────────
  async function handleCopyAndOpen() {
    const text = editedText.trim()
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard API unavailable — continue silently
    }

    setCopied(true)
    setOpened(true)

    const serviceLabel = serviceTags.find((t) => t.id === selectedService)?.label
    const categoryLabels = categoryTags
      .filter((t) => selectedCategories.includes(t.id))
      .map((t) => t.label)

    fetch('/api/review/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        rating: initialRating,
        selected_tags: [serviceLabel, ...categoryLabels].filter(Boolean),
        ai_variant_chosen: text,
        redirected_to_google: true,
      }),
    }).catch(() => {})

    window.open(googleReviewLink, '_blank', 'noopener,noreferrer')
    onComplete(text)
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ══ STEP 1: Tags ═══════════════════════════════════════════════ */}
      <section
        className={cn(
          'rounded-2xl border p-5 space-y-5 transition-all duration-200',
          step1Done ? 'border-green-200 bg-green-50/40' : 'border-slate-200 bg-white shadow-sm'
        )}
        aria-label="Step 1: Select tags"
      >
        <StepHeader
          number={1}
          title="What did you love?"
          subtitle="Pick ONE Service Tag and AT LEAST ONE Category Tag."
          active={!step1Done}
          done={step1Done}
        />

        {/* Service */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Service{' '}
            <span className="font-normal normal-case text-slate-400">(Pick exactly 1)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {serviceTags.map((tag) => (
              <TagPill
                key={tag.id}
                label={tag.label}
                selected={selectedService === tag.id}
                onClick={() => setSelectedService((p) => (p === tag.id ? null : tag.id))}
              />
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Categories{' '}
            <span className="font-normal normal-case text-slate-400">(Pick at least 1)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((tag) => {
              const sel = selectedCategories.includes(tag.id)
              return (
                <TagPill
                  key={tag.id}
                  label={tag.label}
                  selected={sel}
                  onClick={() =>
                    setSelectedCategories((p) =>
                      sel ? p.filter((id) => id !== tag.id) : [...p, tag.id]
                    )
                  }
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ STEP 2: Pick a draft ════════════════════════════════════════ */}
      <section
        ref={step2Ref}
        className={cn(
          'rounded-2xl border p-5 space-y-4 transition-all duration-200',
          !step2Active && 'opacity-40 pointer-events-none select-none',
          step2Done
            ? 'border-green-200 bg-green-50/40'
            : step2Active
            ? 'border-slate-200 bg-white shadow-sm'
            : 'border-slate-100 bg-slate-50'
        )}
        aria-label="Step 2: Choose your review draft"
        aria-disabled={!step2Active}
      >
        <StepHeader
          number={2}
          title="Write your review"
          subtitle="Tap a draft to select it. Edit the wording below if you like."
          active={step2Active && !step2Done}
          done={step2Done}
        />

        {/* Skeleton loader */}
        {isGenerating && (
          <div className="space-y-3" aria-busy="true" aria-label="Generating reviews…">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-4 space-y-2 animate-pulse">
                <div className="h-3.5 bg-slate-200 rounded w-full" />
                <div className="h-3.5 bg-slate-200 rounded w-5/6" />
                <div className="h-3.5 bg-slate-200 rounded w-3/5" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" aria-hidden="true" />
              <span className="text-xs text-slate-400">Writing two personalised drafts…</span>
            </div>
          </div>
        )}

        {/* Two selectable cards */}
        {!isGenerating && step2Active && variants.length > 0 && (
          <div
            className="space-y-3"
            role="radiogroup"
            aria-label="Choose a review draft"
          >
            {variants.map((text, i) => (
              <ReviewCard
                key={i}
                text={text}
                index={i}
                selected={selectedVariantIndex === i}
                onSelect={() => handleSelectVariant(i)}
              />
            ))}
          </div>
        )}

        {/* Editable textarea — appears after a card is selected */}
        {!isGenerating && selectedVariantIndex !== null && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-slate-500">
              ✏️ Edit your review below if you want to tweak the wording:
            </p>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              aria-label="Edit your review before posting"
              className={cn(
                'w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3',
                'text-sm text-slate-700 leading-relaxed resize-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
                'transition-colors duration-150'
              )}
              maxLength={600}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{editedText.length}/600</p>
              {generatedOnce && (
                <button
                  type="button"
                  onClick={generateReviews}
                  disabled={isGenerating}
                  className="text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2 disabled:opacity-40"
                >
                  Regenerate both
                </button>
              )}
            </div>
          </div>
        )}

        {/* Regenerate button before any selection */}
        {!isGenerating && generatedOnce && selectedVariantIndex === null && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={generateReviews}
              className="text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              Regenerate both
            </button>
          </div>
        )}

        {/* Placeholder when step 2 not yet active */}
        {!step2Active && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-300 italic">
            Your review options will show here once step 1 is done.
          </div>
        )}
      </section>

      {/* ══ STEP 3: Post to Google ══════════════════════════════════════ */}
      <section
        ref={step3Ref}
        className={cn(
          'rounded-2xl border p-5 space-y-4 transition-all duration-200',
          !step3Active && 'opacity-40 pointer-events-none select-none',
          step3Active ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50'
        )}
        aria-label="Step 3: Post to Google"
        aria-disabled={!step3Active}
      >
        <StepHeader
          number={3}
          title="Post to Google"
          subtitle="One tap. Your review gets copied then opens Google."
          active={step3Active && !opened}
          done={opened}
        />

        {step3Active && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              📋 We&apos;ll copy your review to clipboard, then open Google Reviews. Just paste &amp; submit!
            </p>

            <Button
              onClick={handleCopyAndOpen}
              disabled={!editedText.trim() || opened}
              className={cn(
                'w-full h-12 text-base font-semibold transition-all duration-200',
                opened
                  ? 'bg-green-500 hover:bg-green-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
              )}
              aria-label="Copy review text and open Google Reviews"
            >
              {opened ? (
                <>
                  <Check className="mr-2 h-5 w-5" aria-hidden="true" />
                  Copied &amp; Google Opened!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" aria-hidden="true" />
                  Copy &amp; Open Google Review
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>

            {opened && (
              <Button
                onClick={() => window.open(googleReviewLink, '_blank', 'noopener,noreferrer')}
                variant="outline"
                className="w-full h-11 text-sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                Open Google Reviews again
              </Button>
            )}
          </div>
        )}

        {!step3Active && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-300 italic">
            Select a review draft above to unlock this step.
          </div>
        )}
      </section>
    </div>
  )
}
