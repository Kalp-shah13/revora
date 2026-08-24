/**
 * POST /api/review/submit
 * Public — submit a review (positive path) or feedback (negative path).
 * Routing is based on rating:
 *   4-5 stars → insert into `reviews` table
 *   1-3 stars → insert into `feedback` table
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { insertReview, insertFeedback } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      business_id,
      rating,
      selected_tags,
      ai_variant_chosen,
      redirected_to_google,
      message,
      contact_info,
    } = body

    if (!business_id || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'business_id and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    if (rating >= 4) {
      // Positive path — insert into reviews
      await insertReview(supabase, {
        business_id,
        rating,
        selected_tags: selected_tags ?? [],
        ai_variant_chosen: ai_variant_chosen ?? null,
        redirected_to_google: redirected_to_google ?? false,
      })
    } else {
      // Negative path — insert into feedback
      await insertFeedback(supabase, {
        business_id,
        rating,
        message: message ?? null,
        contact_info: contact_info ?? null,
        status: 'open',
      })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('[POST /api/review/submit]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
