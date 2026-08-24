import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Star } from 'lucide-react'
import ReviewFlow from '@/components/review/ReviewFlow'
import { getBusinessBySlug, getServiceTags } from '@/lib/db'
import { createServiceRoleClient } from '@/lib/supabase/service'

interface ReviewPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const { slug } = await params
  const sp = await searchParams

  const supabase = createServiceRoleClient()
  const business = await getBusinessBySlug(supabase, slug)
  if (!business) notFound()

  const tags = await getServiceTags(supabase, business.id)
  const accentColor = business.accent_color || '#D97706'

  const ratingParam = sp?.rating
  const rawRating = Array.isArray(ratingParam) ? ratingParam[0] : ratingParam
  const initialRating = rawRating ? Math.min(5, Math.max(1, parseInt(rawRating, 10))) : undefined
  const displayStars = initialRating ?? 5

  return (
    /* Matches reference: soft blue-gray gradient background */
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(170deg, #eef2ff 0%, #f0f4ff 40%, #f5f7ff 100%)' }}>

      {/* Skip link */}
      <a
        href="#review-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Top accent line */}
      <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${accentColor}, #6366f1)` }} aria-hidden="true" />

      <div className="flex-1 flex flex-col items-center px-4 pt-8 pb-16">
        <main id="review-main" className="w-full max-w-md space-y-5" tabIndex={-1}>

          {/* ── Hero header ── */}
          <div className="text-center space-y-3">

            {/* Stars row */}
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex gap-0.5" aria-label={`${displayStars} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-8 h-8 drop-shadow-sm"
                    style={
                      s <= displayStars
                        ? { fill: '#FBBF24', color: '#FBBF24' }
                        : { fill: '#E2E8F0', color: '#E2E8F0' }
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-base font-semibold text-slate-500 ml-1">
                {displayStars} stars
              </span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Share your experience
              </h1>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                A few seconds to help others discover this place
              </p>
            </div>

            {/* ── Business logo — shown between heading and review flow ── */}
            <div className="flex justify-center pt-1">
              {business.logo_url ? (
                /* Business has a custom logo */
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-slate-200/60 blur-xl scale-110" aria-hidden="true" />
                  <Image
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    width={96}
                    height={96}
                    className="relative rounded-3xl object-cover shadow-lg ring-4 ring-white"
                    priority
                  />
                </div>
              ) : (
                /* Fallback — initials avatar with accent colour */
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ring-4 ring-white"
                  style={{ backgroundColor: accentColor + '22', border: `2px solid ${accentColor}40` }}
                  aria-hidden="true"
                >
                  <span
                    className="text-3xl font-extrabold"
                    style={{ color: accentColor }}
                  >
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Business name */}
            <p className="text-base font-bold text-slate-800 tracking-tight">
              {business.name}
            </p>

          </div>

          {/* ── Review flow ── */}
          <ReviewFlow
            businessId={business.id}
            businessName={business.name}
            googleReviewLink={business.google_review_link}
            tags={tags.map((t) => ({ id: t.id, label: t.label, tag_type: t.tag_type }))}
            initialRating={initialRating}
          />

        </main>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-slate-400">Powered by GleamAI</p>
      </footer>
    </div>
  )
}

export function generateMetadata() {
  return {
    title: 'Leave a Review',
    description: 'Share your experience with us',
  }
}
