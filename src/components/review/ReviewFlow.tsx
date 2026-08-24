'use client'

/**
 * ReviewFlow — top-level orchestrator.
 *
 * Positive path (rating ≥ 4): hands off to ReviewBuilder (single-page scroll layout)
 * Negative path (rating 1–3): private FeedbackForm
 */
import { useState, useEffect } from 'react'
import { Heart, ExternalLink } from 'lucide-react'
import StarRating from './StarRating'
import FeedbackForm from './FeedbackForm'
import ReviewBuilder from './ReviewBuilder'

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
      <div className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-2 py-10 overflow-hidden">

        {/* ── Floating confetti dots ── */}
        {[
          { size: 'w-3 h-3', color: 'bg-amber-400',   top: '8%',  left: '10%',  delay: '0s'    },
          { size: 'w-2 h-2', color: 'bg-blue-400',    top: '15%', left: '80%',  delay: '0.3s'  },
          { size: 'w-2 h-2', color: 'bg-green-400',   top: '30%', left: '88%',  delay: '0.6s'  },
          { size: 'w-3 h-3', color: 'bg-purple-400',  top: '55%', left: '6%',   delay: '0.2s'  },
          { size: 'w-2 h-2', color: 'bg-pink-400',    top: '70%', left: '82%',  delay: '0.8s'  },
          { size: 'w-2 h-2', color: 'bg-blue-300',    top: '80%', left: '20%',  delay: '0.4s'  },
          { size: 'w-3 h-3', color: 'bg-amber-300',   top: '85%', left: '65%',  delay: '1s'    },
          { size: 'w-2 h-2', color: 'bg-green-300',   top: '20%', left: '50%',  delay: '0.7s'  },
        ].map((dot, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute rounded-full ${dot.size} ${dot.color} opacity-60 animate-bounce-slow`}
            style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
          />
        ))}

        {/* ── Party popper illustration ── */}
        <div className="relative mb-5">
          {/* Outer soft circle */}
          <div className="w-28 h-28 rounded-full bg-purple-100/70 flex items-center justify-center">
            {/* Inner circle */}
            <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center text-5xl select-none">
              🎉
            </div>
          </div>
        </div>

        {/* ── "Review submitted" pill ── */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm mb-5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-600 tracking-wide">Review submitted</span>
        </div>

        {/* ── Heading ── */}
        <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">
          Thank you for your review!
        </h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
          Your kind words help others discover this place on Google.
        </p>

        {/* ── "One more step" banner ── */}
        <div className="w-full max-w-sm rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-left mb-6">
          <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">
            One more step
          </p>
          <p className="text-sm text-green-800 leading-relaxed">
            Your review was copied to clipboard. Head to Google and paste it to complete your review.
          </p>
        </div>

        {/* ── Open Google button ── */}
        <button
          onClick={() => window.open(googleReviewLink, '_blank', 'noopener,noreferrer')}
          className="w-full max-w-sm h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20 mb-5"
          aria-label="Open Google Reviews"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Open Google Reviews
        </button>

        {/* ── Back to home ── */}
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Back to home"
        >
          ← Back to home
        </button>

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
