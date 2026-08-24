'use client'

/**
 * ReviewFlow — top-level orchestrator.
 *
 * Positive path (rating ≥ 4): hands off to ReviewBuilder (single-page scroll layout)
 * Negative path (rating 1–3): private FeedbackForm
 */
import { useState, useEffect } from 'react'
import { Heart, ExternalLink, CheckCircle2 } from 'lucide-react'
import StarRating from './StarRating'
import FeedbackForm from './FeedbackForm'
import ReviewBuilder from './ReviewBuilder'
import { Button } from '@/components/ui/button'

type Stage = 'rating' | 'building' | 'done' | 'feedback' | 'thankyou'

interface Tag {
  id: string
  label: string
}

interface ReviewFlowProps {
  businessId: string
  businessName: string
  googleReviewLink: string
  tags: Tag[]
  /** Optional pre-selected rating from URL search params */
  initialRating?: number
}

export default function ReviewFlow({
  businessId,
  businessName,
  googleReviewLink,
  tags,
  initialRating,
}: ReviewFlowProps) {
  const [stage, setStage] = useState<Stage>(() => {
    // If a valid pre-selected rating is provided, skip the rating step
    if (initialRating && initialRating >= 1 && initialRating <= 5) {
      return initialRating >= 4 ? 'building' : 'feedback'
    }
    return 'rating'
  })

  const [rating, setRating] = useState<number>(initialRating ?? 0)
  const [chosenReview, setChosenReview] = useState('')

  // Log scan on mount (fire-and-forget)
  useEffect(() => {
    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId }),
    }).catch(() => {})
  }, [businessId])

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleRatingSelect(r: number) {
    setRating(r)
    setTimeout(() => {
      setStage(r >= 4 ? 'building' : 'feedback')
    }, 300)
  }

  function handleBuildComplete(text: string) {
    setChosenReview(text)
    setStage('done')
  }

  // ── Stages ───────────────────────────────────────────────────────────────

  if (stage === 'rating') {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">How was your visit?</h2>
          <p className="text-sm text-slate-500">Tap a star to rate your experience</p>
        </div>
        <StarRating onSelect={handleRatingSelect} />
      </div>
    )
  }

  if (stage === 'building') {
    return (
      <ReviewBuilder
        businessId={businessId}
        businessName={businessName}
        googleReviewLink={googleReviewLink}
        tags={tags}
        initialRating={rating || initialRating || 5}
        onComplete={handleBuildComplete}
      />
    )
  }

  if (stage === 'done') {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-500" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Review copied!</h2>
          <p className="text-sm text-slate-500">
            A new tab opened — just paste your review and hit Post.
          </p>
        </div>
        {chosenReview && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600 italic">
            &ldquo;{chosenReview}&rdquo;
          </div>
        )}
        <Button
          onClick={() => window.open(googleReviewLink, '_blank', 'noopener,noreferrer')}
          variant="outline"
          className="w-full h-11"
        >
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          Open Google Reviews again
        </Button>
        <p className="text-xs text-slate-400">
          Thank you for taking the time — it means a lot! 🙏
        </p>
      </div>
    )
  }

  if (stage === 'feedback') {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">We want to do better</h2>
          <p className="text-sm text-slate-500">
            Your feedback goes directly to the team — not public
          </p>
        </div>
        <FeedbackForm
          businessId={businessId}
          rating={rating || initialRating || 1}
          onSubmitted={() => setStage('thankyou')}
        />
      </div>
    )
  }

  if (stage === 'thankyou') {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
          <Heart className="h-8 w-8 text-blue-400 fill-blue-400" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Thank you</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            We appreciate your honesty. We&apos;ll use your feedback to make things right.
          </p>
        </div>
        <p className="text-xs text-slate-400">We&apos;ll make it right 💪</p>
      </div>
    )
  }

  return null
}
