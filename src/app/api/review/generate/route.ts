/**
 * POST /api/review/generate
 * Public — generate 2 human-sounding Google review variants using OpenAI GPT-4o-mini.
 *
 * Core philosophy:
 *   Real people write reviews on their phone in 30 seconds.
 *   They use casual language, normal punctuation, no lists, no hype,
 *   no corporate words, no AI tell-tale patterns.
 *   Google's spam filters flag reviews that look machine-generated.
 *   Every rule below exists to defeat those filters.
 *
 * Rate limited: 10 requests per minute per IP.
 */
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { sanitizeForPrompt } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Human persona library ────────────────────────────────────────────────────
// Each persona describes a real-world type of customer.
// Two are picked randomly per request so the two cards always feel like
// completely different people — different age, tone, detail level.

const PERSONAS = [
  {
    id: 'busy-parent',
    description: 'a parent in their late 30s, always in a hurry, types quickly on a phone, uses short sentences and gets straight to the point, very genuine, no fuss',
    length: '1 to 2 sentences, under 55 words total',
    tone: 'matter-of-fact, warm but brief',
  },
  {
    id: 'local-regular',
    description: 'a local resident who has been to a lot of places and knows what good service looks like, slightly conversational, shares a small personal detail or observation, sounds like they actually went there',
    length: '2 to 3 sentences, 55 to 90 words',
    tone: 'natural, grounded, occasionally uses everyday phrases like "to be honest" or "honestly"',
  },
  {
    id: 'first-timer',
    description: 'someone visiting for the first time, slightly surprised by how good it was, shares one specific thing that stood out, writes the way they would text a friend',
    length: '2 sentences, 40 to 70 words',
    tone: 'slightly enthusiastic but still natural, avoids superlatives',
  },
  {
    id: 'professional',
    description: 'a working professional in their 40s, precise, values time and quality, notices specific details, writes clearly but informally',
    length: '2 sentences, 50 to 80 words',
    tone: 'calm, considered, specific — no fluff',
  },
  {
    id: 'older-customer',
    description: 'a customer in their 50s or 60s who is not very tech-savvy, writes simply and directly, focuses on how they were treated and whether they would come back',
    length: '1 to 2 short sentences, under 50 words',
    tone: 'simple, sincere, old-fashioned warmth',
  },
  {
    id: 'young-adult',
    description: 'a person in their mid-20s who goes out a lot, compares to other places, casually mentions value or atmosphere, writes the way they would on WhatsApp — lowercase is fine, relaxed',
    length: '2 sentences, 40 to 70 words',
    tone: 'casual, honest, uses "pretty" or "actually" naturally',
  },
]

// ─── Opening fragment seeds ───────────────────────────────────────────────────
// These are injected as inspiration for how to begin the review.
// They prevent GPT from always starting with the same patterns.
// GPT is told to adapt them naturally, not copy them verbatim.

const OPENERS = [
  'Went here recently',
  'Stopped by last week',
  'Just visited for the first time',
  'Been a few times now',
  'Tried this place out',
  'Came here on a friends recommendation',
  'Finally got around to visiting',
  'Popped in on a whim',
  'Had a good experience here',
  'Checked this place out',
  'Visited with family',
  'Came in for the first time',
  'Honestly just needed somewhere good',
  'Was passing by and decided to go in',
  'Had heard good things',
]

// ─── Fallback reviews ─────────────────────────────────────────────────────────
// Used only when AI is unavailable or rate-limited.
// These are written to look like real human reviews.

const FALLBACK_VARIANTS = [
  "Came here on a recommendation and it genuinely delivered. Staff were friendly and the whole thing was smooth from the moment I walked in. Would come back no question.",
  "Really solid place. Felt well looked after throughout and everything was handled properly. Glad I found it and will be telling others.",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Pick N unique random items from an array */
function pickUniqueRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// ─── Post-processing ──────────────────────────────────────────────────────────
// Strips any remaining AI artifacts that GPT occasionally sneaks in.

function humanise(text: string): string {
  return text
    // Remove leading/trailing quotation marks GPT sometimes wraps output in
    .replace(/^["'""''`]+|["'""''`]+$/g, '')
    // Remove any dashes used as list markers or em-dashes
    .replace(/\s*[–—]\s*/g, ' ')
    .replace(/\s+-\s+/g, ' ')
    // Remove bullet point characters
    .replace(/^[•·▪▸►*]\s*/gm, '')
    // Collapse multiple spaces
    .replace(/  +/g, ' ')
    // Remove trailing colons that GPT uses as headers
    .replace(/:\s*$/g, '')
    // Strip "Review:" or "Review text:" type labels
    .replace(/^(review\s*(text)?\s*:?\s*)/i, '')
    .trim()
}

// ─── Build the system prompt ──────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You write Google reviews that sound exactly like a real human typed them on their phone.

Your job is to make the review pass Google's AI detection filters. That means:
- No formatting of any kind. No bullet points, no numbered lists, no headers, no line breaks inside the review.
- No dashes of any kind. Not hyphens, not en-dashes, not em-dashes. Zero.
- No forward slashes or backward slashes anywhere.
- No colon lists. Never write "thing: detail" or "reason: because".
- No exclamation marks. Real people on phones do use them occasionally but you must avoid them entirely.
- No AI-favourite words. Never use: amazing, absolutely, incredible, exceeded expectations, truly, seamlessly, testament, top-notch, phenomenal, outstanding, stellar, impeccable, unwavering, delightful, thrilled, blown away, can't recommend enough, exceptional, remarkable, superb, fantastic, wonderful, perfect, flawless, kudos, certainly, ensure, leverage, facilitate, robust, comprehensive, curated, bespoke, tailored, cutting-edge, state-of-the-art, world-class.
- No corporate or marketing language. Write the way a real person talks.
- Do not start with "I". Start with the business name, a general observation, or what stood out.
- Do not start multiple sentences with "The".
- No fake-sounding superlatives. Instead of "the best place ever" say "one of the better ones I have tried".
- Output ONLY the review text. Nothing else. No label, no prefix, no explanation, no quotes around it.`
}

// ─── Build the user prompt for one variant ───────────────────────────────────

function buildUserPrompt(
  safeName: string,
  safeTags: string[],
  persona: typeof PERSONAS[number],
  opener: string,
  variationSeed: number
): string {
  // Variation seeds change the instructions slightly to force different output
  const variationHints = [
    'Focus mostly on how the customer was made to feel.',
    'Mention a specific moment or detail that stood out.',
    'Compare briefly to similar places the customer has been to.',
    'Focus on the overall value and whether they would return.',
    'Describe the experience from arrival to leaving.',
    'Mention something they noticed that others might overlook.',
  ]
  const hint = variationHints[variationSeed % variationHints.length]

  return `Write a Google review for a real customer visiting ${safeName}.

What the customer wants to mention: ${safeTags.join(', ')}

Write as if you are: ${persona.description}
Length: ${persona.length}
Tone: ${persona.tone}
Opening inspiration (adapt this naturally, do not copy word for word): "${opener}"
Angle for this review: ${hint}

Remember: output only the review text. No punctuation symbols like dashes, slashes or bullets anywhere. No exclamation marks. No AI words.`
}

// ─── Validation ───────────────────────────────────────────────────────────────

const BANNED_SYMBOLS = /[-–—/\\|•·]|!{1,}/
const BANNED_WORDS   = /\b(amazing|absolutely|incredible|exceeded expectations|truly|seamlessly|testament|top-notch|phenomenal|outstanding|stellar|impeccable|unwavering|delightful|thrilled|blown away|can't recommend enough|exceptional|remarkable|superb|fantastic|wonderful|perfect|flawless|kudos|certainly|ensure|leverage|facilitate|robust|comprehensive|curated|bespoke|tailored|cutting-edge|state-of-the-art|world-class)\b/i
const STARTS_WITH_I  = /^i\b/i
const HAS_STRUCTURE  = /:\s|\n|\r|•|·|^\d+\./m

function isHumanEnough(text: string): boolean {
  if (!text || text.length < 30 || text.length > 700) return false
  if (BANNED_SYMBOLS.test(text))  return false
  if (BANNED_WORDS.test(text))    return false
  if (STARTS_WITH_I.test(text))   return false
  if (HAS_STRUCTURE.test(text))   return false
  return true
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limit: 10 generate requests per minute per IP
  const ip = getClientIp(request)
  const { allowed } = rateLimit(`generate:${ip}`, { limit: 10, windowMs: 60_000 })

  if (!allowed) {
    return NextResponse.json(
      { data: { variants: FALLBACK_VARIANTS }, warning: 'Rate limited — using fallback reviews' },
      { status: 200 }
    )
  }

  try {
    const body = await request.json()
    const { business_name, selected_tags, business_id } = body

    if (!business_name || !business_id) {
      return NextResponse.json(
        { error: 'business_name and business_id are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(selected_tags) || selected_tags.length === 0) {
      return NextResponse.json({ data: { variants: FALLBACK_VARIANTS } })
    }

    const safeName = sanitizeForPrompt(String(business_name), 100)
    const safeTags = (selected_tags as unknown[])
      .map((tag) => sanitizeForPrompt(String(tag), 50))
      .filter(Boolean)

    if (!safeName) {
      return NextResponse.json({ data: { variants: FALLBACK_VARIANTS } })
    }

    // Pick 2 completely different personas for the two cards
    const [persona1, persona2] = pickUniqueRandom(PERSONAS, 2)
    const opener1 = pickRandom(OPENERS)
    // Make sure opener2 is different from opener1
    const opener2 = pickRandom(OPENERS.filter(o => o !== opener1))

    const systemPrompt = buildSystemPrompt()

    // Generate both variants concurrently
    // Each gets a different persona, opener, variation seed, and temperature
    const variantPromises = [
      { persona: persona1, opener: opener1, seed: Math.floor(Math.random() * 6), temp: 0.92, fallback: FALLBACK_VARIANTS[0] },
      { persona: persona2, opener: opener2, seed: Math.floor(Math.random() * 6), temp: 1.05, fallback: FALLBACK_VARIANTS[1] },
    ].map(({ persona, opener, seed, temp, fallback }) =>
      openai.chat.completions
        .create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: buildUserPrompt(safeName, safeTags, persona, opener, seed) },
          ],
          max_tokens: 200,
          temperature: temp,
          // High presence + frequency penalty = less repetition of training patterns
          presence_penalty: 0.8,
          frequency_penalty: 0.7,
        })
        .then((res) => {
          const raw = res.choices[0]?.message?.content?.trim() ?? ''
          return humanise(raw)
        })
        .catch(() => fallback)
    )

    let variants = await Promise.all(variantPromises)

    // Validate each variant — if it fails, retry once with different seeds
    variants = await Promise.all(
      variants.map(async (v, i) => {
        if (isHumanEnough(v)) return v

        // One retry with a fresh opener and seed
        const retryPersona = pickRandom(PERSONAS)
        const retryOpener  = pickRandom(OPENERS)
        const retrySeed    = Math.floor(Math.random() * 6)

        try {
          const retry = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: buildUserPrompt(safeName, safeTags, retryPersona, retryOpener, retrySeed) },
            ],
            max_tokens: 200,
            temperature: 1.1,
            presence_penalty: 0.9,
            frequency_penalty: 0.8,
          })
          const retried = humanise(retry.choices[0]?.message?.content?.trim() ?? '')
          return isHumanEnough(retried) ? retried : FALLBACK_VARIANTS[i]
        } catch {
          return FALLBACK_VARIANTS[i]
        }
      })
    )

    return NextResponse.json({ data: { variants } })

  } catch (error) {
    console.error('[POST /api/review/generate]', error)
    return NextResponse.json({
      data: { variants: FALLBACK_VARIANTS },
      warning: 'Used fallback reviews due to AI service issue',
    })
  }
}
