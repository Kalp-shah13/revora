/**
 * POST /api/scan
 * Public — log a QR scan event.
 * Rate limited: 30 scans per minute per IP.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { insertQrScan } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 30 scans/min per IP
  const ip = getClientIp(request)
  const { allowed } = rateLimit(`scan:${ip}`, { limit: 30, windowMs: 60_000 })

  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { business_id } = body

    if (!business_id || typeof business_id !== 'string') {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const userAgent = request.headers.get('user-agent') ?? null

    await insertQrScan(supabase, { business_id, user_agent: userAgent })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('[POST /api/scan]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
