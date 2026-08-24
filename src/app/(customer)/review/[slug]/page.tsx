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

  // Use service role to bypass RLS for public page read
  const supabase = createServiceRoleClient()

  const business = await getBusinessBySlug(supabase, slug)
  if (!business) notFound()

  const tags = await getServiceTags(supabase, business.id)

  const accentColor = business.accent_color || '#D97706'

  // Read optional ?rating=N from URL (e.g. from QR code or deep link)
  const ratingParam = sp?.rating
  const rawRating = Array.isArray(ratingParam) ? ratingParam[0] : ratingParam
  const initialRating = rawRating ? Math.min(5, Math.max(1, parseInt(rawRating, 10))) : undefined

  // Star count for the header (show if pre-selected)
  const displayStars = initialRating ?? 5

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #fffbeb 0%, #fff7f0 50%, #fef9ee 100%)' }}>
      {/* Skip to main content */}
      <a
        href="#review-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Accent header strip */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 pb-12">
        <main id="review-main" className="w-full max-w-sm space-y-6" tabIndex={-1}>

          {/* Business header */}
          <div className="text-center space-y-3">
            {business.logo_url ? (
              <div className="flex justify-center">
                <Image
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  width={72}
                  height={72}
                  className="rounded-2xl object-cover shadow-md"
                  priority
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
                style={{ backgroundColor: accentColor + '20' }}
                aria-hidden="true"
              >
                <Star
                  className="w-8 h-8"
                  style={{ color: accentColor, fill: accentColor }}
                  aria-hidden="true"
                />
              </div>
            )}

            {/* Star display */}
            <div className="flex justify-center gap-1" aria-label={`${displayStars} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-5 h-5"
                  style={
                    s <= displayStars
                      ? { fill: accentColor, color: accentColor }
                      : { fill: '#E2E8F0', color: '#E2E8F0' }
                  }
                  aria-hidden="true"
                />
              ))}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">Share your experience</p>
              <p className="text-xs text-slate-400 mt-1">
                A few seconds to help others discover this place
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200/60" aria-hidden="true" />

          {/* Review flow */}
          <ReviewFlow
            businessId={business.id}
            businessName={business.name}
            googleReviewLink={business.google_review_link}
            tags={tags.map((t) => ({ id: t.id, label: t.label }))}
            initialRating={initialRating}
          />
        </main>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-slate-300">Powered by GleamAI</p>
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
