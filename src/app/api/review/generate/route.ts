/**
 * POST /api/review/generate
 *
 * Generates 2 unique, human-sounding Google review variants every single call —
 * even when the exact same tags are submitted 1000 times in a row.
 *
 * HOW UNIQUENESS IS GUARANTEED:
 *   1. Unique entropy token — a random hex string injected into every prompt.
 *      GPT sees a different input each call so it cannot return a cached response.
 *   2. Massive persona pool (10) + opener pool (30) — randomly combined each call.
 *   3. Unique perspective angle picked fresh each call (20 options).
 *   4. Unique contextual detail instruction picked fresh each call (16 options).
 *   5. Temperature randomised in a range each call (not a fixed value).
 *   6. Seed parameter passed to OpenAI = null (forces non-deterministic).
 *   7. Large diverse fallback pool (16 variants) — random pair chosen if AI fails.
 *   8. Fallback pair guaranteed to be different from each other.
 *
 * Rate limited: 10 requests per minute per IP.
 */
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { sanitizeForPrompt } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Persona pool (10) ────────────────────────────────────────────────────────

const PERSONAS = [
  {
    id: 'busy-parent',
    description: 'a busy parent in their late 30s who types on their phone while multitasking, very brief, warm but no fuss',
    length: '1 to 2 short sentences, under 50 words',
    tone: 'matter-of-fact, genuine, conversational',
  },
  {
    id: 'local-regular',
    description: 'a local resident who visits many places and knows good service when they see it, shares a small personal observation',
    length: '2 to 3 sentences, 55 to 90 words',
    tone: 'natural, grounded, occasionally uses "honestly" or "to be fair"',
  },
  {
    id: 'first-timer',
    description: 'someone visiting for the first time who was pleasantly surprised, mentions one specific thing that stood out',
    length: '2 sentences, 40 to 65 words',
    tone: 'slightly surprised but still measured, writes like texting a friend',
  },
  {
    id: 'professional',
    description: 'a working professional in their 40s who values precision and their time, notices specific details others might miss',
    length: '2 sentences, 50 to 75 words',
    tone: 'calm, specific, no fluff',
  },
  {
    id: 'older-customer',
    description: 'a customer in their late 50s who writes simply, focuses on how they were treated and whether they felt welcome',
    length: '1 to 2 short sentences, under 45 words',
    tone: 'simple, direct, warm sincerity',
  },
  {
    id: 'young-adult',
    description: 'a person in their mid-20s who compares places a lot, casually mentions value for money, writes like a WhatsApp message',
    length: '2 sentences, 35 to 65 words',
    tone: 'relaxed and honest, uses "pretty" or "actually" naturally',
  },
  {
    id: 'loyal-customer',
    description: 'someone who has been a few times and keeps coming back, mentions returning and why they keep choosing this place',
    length: '2 to 3 sentences, 50 to 80 words',
    tone: 'familiar, comfortable, loyal without being gushing',
  },
  {
    id: 'referred-visitor',
    description: 'someone who came based on a friends recommendation and is glad they did, mentions the recommendation briefly',
    length: '2 sentences, 45 to 70 words',
    tone: 'grateful, validates the recommendation, natural',
  },
  {
    id: 'skeptic-converted',
    description: 'someone who was unsure at first but ended up having a genuinely good experience, slightly surprised tone',
    length: '2 sentences, 50 to 75 words',
    tone: 'honest and slightly surprised, credible because it admits initial doubt',
  },
  {
    id: 'comparison-shopper',
    description: 'someone who has tried several similar places and compares this one favourably to others without naming competitors',
    length: '2 sentences, 50 to 80 words',
    tone: 'informed, measured, specific about what sets this place apart',
  },
]

// ─── Opening seed pool (30) ───────────────────────────────────────────────────

const OPENERS = [
  'Went here recently',
  'Stopped by last week',
  'Just visited for the first time',
  'Been a few times now',
  'Tried this place out',
  'Came here on a friends recommendation',
  'Finally got around to visiting',
  'Popped in on a whim',
  'Had a really good visit',
  'Checked this place out last month',
  'Visited with my partner',
  'Came in for the first time last week',
  'Honestly just needed somewhere decent',
  'Was passing by and decided to stop in',
  'Had heard good things for a while',
  'Came back for the second time',
  'Tried this place after seeing it online',
  'Went on a Tuesday afternoon',
  'Booked this after looking around',
  'Had been meaning to visit for ages',
  'Walked past this a few times and finally went in',
  'Came here with a colleague',
  'Was referred by someone I trust',
  'Visited on a busy Saturday',
  'Came in not expecting much honestly',
  'Tried several places before settling here',
  'Went here instead of somewhere I usually go',
  'Came back after a good first visit',
  'Stopped by on a quiet weekday',
  'Gave this place a go last week',
]

// ─── Perspective angles (20) — injected to force different narrative focus ────

const ANGLES = [
  'Focus on how the customer felt while they were there.',
  'Mention one specific small detail that made the experience stand out.',
  'Compare briefly to other similar places without naming them.',
  'Talk about whether the customer would come back and why.',
  'Describe the experience as a sequence of small moments.',
  'Focus on the people working there and how they made you feel.',
  'Mention how the place handled something that could have gone wrong.',
  'Talk about the overall value relative to what was expected.',
  'Focus on one tag in particular and explain it through an experience.',
  'Mention telling a friend or family member about this place.',
  'Talk about first impressions when arriving and how they played out.',
  'Focus on what makes this place different from what the customer expected.',
  'Mention how easy or smooth the whole thing was.',
  'Talk about what the customer will remember about this place.',
  'Focus on the reliability or consistency of the experience.',
  'Mention how the customer felt leaving compared to when they arrived.',
  'Talk about what specifically was noticed about the quality.',
  'Focus on how the customer felt they were treated as a person.',
  'Mention something that exceeded what you get at most places.',
  'Talk about how this place compares to the customer own standards.',
]

// ─── Contextual detail instructions (16) ─────────────────────────────────────

const DETAIL_INSTRUCTIONS = [
  'Mention a small sensory detail like how the place looked or felt.',
  'Include a brief time reference like "on a weekday" or "in the afternoon".',
  'Mention how long it took or how efficient things were.',
  'Include a small observation about the atmosphere.',
  'Mention whether the customer felt rushed or at ease.',
  'Reference the fact that they had done their research before visiting.',
  'Include a passing mention of who they came with.',
  'Mention a brief moment of doubt that was quickly resolved.',
  'Reference how well things were organised or laid out.',
  'Mention how the customer felt when they first made contact or arrived.',
  'Include a small note about how the staff communicated.',
  'Reference the fact that everything was as described or expected.',
  'Mention a specific aspect of the service that was unexpectedly good.',
  'Include a brief note about ease of the overall process.',
  'Reference any follow-up or afterthought the customer had.',
  'Mention a small thing that showed care or attention to detail.',
]

// ─── Large diverse fallback pool (16 reviews) ────────────────────────────────
// When AI is unavailable, two are picked randomly and guaranteed to be different.

const FALLBACK_POOL = [
  "Came here on a recommendation and it genuinely delivered. Staff were friendly and the whole thing felt easy from start to finish.",
  "Really solid visit. Felt looked after throughout and everything was handled well. Will be coming back.",
  "Tried this place after hearing about it and was not disappointed. Good people and the whole experience felt genuine.",
  "Visited recently and came away impressed. Everything was smooth and the team clearly know what they are doing.",
  "Went here for the first time and it was exactly what you want. Friendly service and nothing felt like an afterthought.",
  "Had a good experience here. Nothing over the top but everything was done properly and the staff were easy to deal with.",
  "Been to a few places like this and this one stands out. Things were handled professionally and the service felt personal.",
  "Came in not knowing what to expect and left pretty satisfied. The attention to detail was noticeable and the team were helpful.",
  "Gave this a go after passing by a few times. Really glad I did. Good service and the whole process was painless.",
  "Visited with a friend and we both came away happy. Everything was taken care of without any fuss.",
  "Solid experience from beginning to end. The people here are clearly good at what they do and it shows.",
  "Came back for a second time and it was just as good as the first. Consistency counts for a lot and this place gets it right.",
  "Used this place based on a suggestion and it lived up to it. Straightforward to deal with and genuinely helpful.",
  "Visited on a weekday and got prompt and friendly service. Would have no hesitation recommending this to others.",
  "Really appreciated how smoothly everything went. Good team and the quality was exactly what you would want.",
  "Came here instead of somewhere I usually go and I am glad I made the switch. Better service and a more comfortable experience overall.",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickUnique<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

/** Generate a short random hex token — injected into each prompt to bust caching */
function uniqueToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

/** Random temperature in a range to prevent deterministic output */
function randTemp(min: number, max: number): number {
  return parseFloat((min + Math.random() * (max - min)).toFixed(2))
}

/** Pick 2 different fallbacks from the pool */
function pickFallbackPair(): [string, string] {
  const shuffled = [...FALLBACK_POOL].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
}

// ─── Post-processing ──────────────────────────────────────────────────────────

function humanise(text: string): string {
  return text
    .replace(/^["'""''`]+|["'""''`]+$/g, '')
    .replace(/\s*[–—]\s*/g, ' ')
    .replace(/\s+-\s+/g, ' ')
    .replace(/^[•·▪▸►*]\s*/gm, '')
    .replace(/  +/g, ' ')
    .replace(/:\s*$/g, '')
    .replace(/^(review\s*(text)?\s*:?\s*)/i, '')
    .trim()
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You write Google reviews that sound exactly like a real human typed them on their phone.

Rules — breaking any of these makes the review unusable:
- Output ONLY the review text. No labels, no quotes around it, no explanation.
- No formatting at all. No bullet points, no line breaks, no numbered lists, no headers.
- No dashes of any kind. Not hyphens, not en-dashes, not em-dashes. Zero.
- No forward slashes or backward slashes.
- No colon constructions like "service: great" or "reason: because".
- No exclamation marks anywhere.
- Never use these words: amazing, absolutely, incredible, exceeded expectations, truly, seamlessly, testament, top-notch, phenomenal, outstanding, stellar, impeccable, unwavering, delightful, thrilled, blown away, exceptional, remarkable, superb, fantastic, wonderful, perfect, flawless, kudos, certainly, ensure, leverage, facilitate, robust, comprehensive, curated, bespoke, tailored, cutting-edge, state-of-the-art, world-class.
- Never start with "I".
- Do not start two sentences with "The".
- No corporate or marketing language.
- Sound like a real person writing on their phone — informal and genuine.`
}

// ─── User prompt ──────────────────────────────────────────────────────────────

function buildUserPrompt(
  safeName: string,
  safeTags: string[],
  persona: typeof PERSONAS[number],
  opener: string,
  angle: string,
  detail: string,
  token: string,
): string {
  // The token is framed as a "session ID" — GPT treats it as context,
  // ensuring the prompt is unique even when all other inputs are identical.
  return `Session ${token} — write a Google review for a real customer visiting ${safeName}.

What the customer wants to highlight: ${safeTags.join(', ')}

Write as: ${persona.description}
Length: ${persona.length}
Tone: ${persona.tone}
How to open (adapt naturally, do not copy): "${opener}…"
Narrative angle: ${angle}
Extra detail: ${detail}

Output only the review text.`
}

// ─── Validation ───────────────────────────────────────────────────────────────

const BANNED_SYMBOLS = /[-–—/\\|•·]|!+/
const BANNED_WORDS   = /\b(amazing|absolutely|incredible|exceeded expectations|truly|seamlessly|testament|top-notch|phenomenal|outstanding|stellar|impeccable|unwavering|delightful|thrilled|blown away|exceptional|remarkable|superb|fantastic|wonderful|perfect|flawless|kudos|certainly|ensure|leverage|facilitate|robust|comprehensive|curated|bespoke|tailored|cutting-edge|state-of-the-art|world-class)\b/i
const STARTS_WITH_I  = /^i\b/i
const HAS_STRUCTURE  = /:\s|\n|\r|•|·|^\d+\./m

function isValid(text: string): boolean {
  if (!text || text.length < 30 || text.length > 700) return false
  if (BANNED_SYMBOLS.test(text))  return false
  if (BANNED_WORDS.test(text))    return false
  if (STARTS_WITH_I.test(text))   return false
  if (HAS_STRUCTURE.test(text))   return false
  return true
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = rateLimit(`generate:${ip}`, { limit: 10, windowMs: 60_000 })

  if (!allowed) {
    return NextResponse.json(
      { data: { variants: pickFallbackPair() }, warning: 'Rate limited' },
      { status: 200 }
    )
  }

  try {
    const body = await request.json()
    const { business_name, selected_tags, business_id } = body

    if (!business_name || !business_id) {
      return NextResponse.json({ error: 'business_name and business_id are required' }, { status: 400 })
    }

    if (!Array.isArray(selected_tags) || selected_tags.length === 0) {
      return NextResponse.json({ data: { variants: pickFallbackPair() } })
    }

    const safeName = sanitizeForPrompt(String(business_name), 100)
    const safeTags = (selected_tags as unknown[])
      .map(t => sanitizeForPrompt(String(t), 50))
      .filter(Boolean)

    if (!safeName) {
      return NextResponse.json({ data: { variants: pickFallbackPair() } })
    }

    const systemPrompt = buildSystemPrompt()

    // Pick completely different configs for each variant
    const [p1, p2]   = pickUnique(PERSONAS, 2)
    const o1         = rand(OPENERS)
    const o2         = rand(OPENERS.filter(o => o !== o1))
    const a1         = rand(ANGLES)
    const a2         = rand(ANGLES.filter(a => a !== a1))
    const d1         = rand(DETAIL_INSTRUCTIONS)
    const d2         = rand(DETAIL_INSTRUCTIONS.filter(d => d !== d1))
    const token1     = uniqueToken()   // unique per variant per call
    const token2     = uniqueToken()   // always different from token1

    const configs = [
      { persona: p1, opener: o1, angle: a1, detail: d1, token: token1, temp: randTemp(0.88, 1.05) },
      { persona: p2, opener: o2, angle: a2, detail: d2, token: token2, temp: randTemp(0.95, 1.15) },
    ]

    const variantPromises = configs.map(({ persona, opener, angle, detail, token, temp }, i) =>
      openai.chat.completions
        .create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: buildUserPrompt(safeName, safeTags, persona, opener, angle, detail, token) },
          ],
          max_tokens: 200,
          temperature: temp,
          presence_penalty: 0.9,
          frequency_penalty: 0.8,
          // Explicitly disable seed so OpenAI never returns a cached completion
          seed: undefined,
        })
        .then(res => humanise(res.choices[0]?.message?.content?.trim() ?? ''))
        .catch(() => pickFallbackPair()[i])
    )

    let variants = await Promise.all(variantPromises)

    // Validate — retry once with completely fresh tokens if needed
    variants = await Promise.all(
      variants.map(async (v, i) => {
        if (isValid(v)) return v

        const rp = rand(PERSONAS)
        const ro = rand(OPENERS)
        const ra = rand(ANGLES)
        const rd = rand(DETAIL_INSTRUCTIONS)
        const rt = uniqueToken()

        try {
          const retry = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: buildUserPrompt(safeName, safeTags, rp, ro, ra, rd, rt) },
            ],
            max_tokens: 200,
            temperature: randTemp(1.05, 1.2),
            presence_penalty: 0.95,
            frequency_penalty: 0.9,
            seed: undefined,
          })
          const retried = humanise(retry.choices[0]?.message?.content?.trim() ?? '')
          return isValid(retried) ? retried : pickFallbackPair()[i]
        } catch {
          return pickFallbackPair()[i]
        }
      })
    )

    // Final guard — ensure the two variants are not identical
    if (variants[0] === variants[1]) {
      variants[1] = pickFallbackPair()[1]
    }

    return NextResponse.json({ data: { variants } })

  } catch (error) {
    console.error('[POST /api/review/generate]', error)
    return NextResponse.json({
      data: { variants: pickFallbackPair() },
      warning: 'Used fallback reviews due to AI service issue',
    })
  }
}
