/**
 * POST /api/review/generate
 *
 * The review is ALWAYS built around the exact tags the customer selected.
 * Service tag = the main subject (what they did/bought).
 * Category tags = the qualities they experienced (woven naturally into sentences).
 *
 * Example: Service="Diamond Jewellery Purchase", Category="Fair & Honest Pricing"
 * → Review talks about buying diamond jewellery and finding the pricing fair.
 *
 * NEVER generic. NEVER pre-written. Different every single call.
 */
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { sanitizeForPrompt } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Persona pool ─────────────────────────────────────────────────────────────

const PERSONAS = [
  { desc: 'a regular customer in their 30s, writes briefly on a phone, warm and direct', length: '2 sentences, 40 to 60 words' },
  { desc: 'a local who has visited many similar businesses and knows quality, shares a small personal observation', length: '2 to 3 sentences, 55 to 85 words' },
  { desc: 'a first-time visitor pleasantly surprised by the experience, mentions one thing that stood out', length: '2 sentences, 45 to 70 words' },
  { desc: 'a professional in their 40s who values precision and their time, specific and no-nonsense', length: '2 sentences, 50 to 75 words' },
  { desc: 'someone in their 50s who writes simply and focuses on how they were treated', length: '1 to 2 sentences, under 50 words' },
  { desc: 'a person in their mid-20s, casual and honest, writes like a WhatsApp message', length: '2 sentences, 35 to 60 words' },
  { desc: 'a loyal returning customer who mentions they keep coming back and why', length: '2 to 3 sentences, 55 to 80 words' },
  { desc: 'someone who came on a recommendation and is glad they did', length: '2 sentences, 45 to 65 words' },
  { desc: 'someone who was initially unsure but had a genuinely good experience', length: '2 sentences, 50 to 75 words' },
  { desc: 'someone who has tried several similar places and prefers this one', length: '2 sentences, 50 to 75 words' },
]

// ─── Opener seeds ─────────────────────────────────────────────────────────────

const OPENERS = [
  'Went here recently', 'Stopped by last week', 'Just visited for the first time',
  'Been a few times now', 'Tried this place out', 'Came here on a friends recommendation',
  'Finally got around to visiting', 'Popped in on a whim', 'Had a really good visit',
  'Checked this place out last month', 'Visited with my partner', 'Was referred by someone I trust',
  'Visited on a busy Saturday', 'Came in not expecting much honestly', 'Had been meaning to visit for ages',
  'Walked past a few times and finally went in', 'Came back after a good first visit',
  'Stopped by on a quiet weekday', 'Gave this place a go last week',
  'Was looking for somewhere good nearby', 'Tried several places before settling here',
  'Went here on a friends tip', 'Came back for the second time', 'Booked this after looking around',
]

// ─── Uniqueness seeds ─────────────────────────────────────────────────────────

const SENTENCE_STRUCTURES = [
  'Open with how it started, then describe what made it good.',
  'Open with the main thing they did, then explain how the category quality showed up.',
  'Open with a general observation, then get specific about the service and quality.',
  'Describe a small moment that captured the experience well.',
  'Compare briefly to similar places without naming them, then say what was different here.',
  'Talk about how they felt arriving, then how they felt leaving.',
  'Mention who they came with, then what stood out to both of them.',
  'Start with the quality, then connect it back to the specific service they used.',
  'Mention they did their research first, then say this place delivered on it.',
  'Open with slight doubt, then describe how it was resolved.',
]

const DETAIL_HINTS = [
  'Include a small sensory detail about the environment.',
  'Mention how long things took or how efficient it was.',
  'Include a passing note about the staff communication.',
  'Mention how welcoming the place felt.',
  'Reference how the customer felt their needs were understood.',
  'Include a note about how the experience compared to expectations.',
  'Mention a small thing that showed care or attention to detail.',
  'Reference how easy or straightforward the whole process was.',
  'Mention that they told someone else about the place.',
  'Include a brief note about whether they would return.',
]

// ─── Fallback pool ────────────────────────────────────────────────────────────
// Only used when OpenAI API is completely unavailable.

const FALLBACK_POOL = [
  "Came here recently and was happy with how things went. The team knew what they were doing and everything was handled properly.",
  "Visited last week and came away impressed. Good service and the quality was exactly what I was looking for.",
  "Been here a couple of times and it keeps delivering. Straightforward to deal with and the staff are genuinely helpful.",
  "Tried this place on a recommendation and it was well worth it. Everything felt professional and the results were great.",
  "Went here for the first time and had no complaints. The experience was smooth and the team clearly know their stuff.",
  "Came in not sure what to expect and left very satisfied. Good attention to detail and easy to deal with throughout.",
  "Solid visit from start to finish. The people here are good at what they do and it shows in the results.",
  "Used this service recently and it was handled well. Everything was as described and the staff were helpful throughout.",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function pickUnique<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}
function uniqueToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}
function randTemp(min: number, max: number): number {
  return parseFloat((min + Math.random() * (max - min)).toFixed(2))
}
function pickFallbackPair(): [string, string] {
  const s = [...FALLBACK_POOL].sort(() => Math.random() - 0.5)
  return [s[0], s[1]]
}

// ─── Clean tag label (strip emoji) ───────────────────────────────────────────

function cleanTag(tag: string): string {
  return tag
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')   // remove emoji
    .replace(/[^\w\s&\/\-\.]/g, '')             // keep letters, &, /, -
    .trim()
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

// ─── Validation ───────────────────────────────────────────────────────────────

const BANNED_SYMBOLS = /[-–—/\\|•·]|!+/
const BANNED_WORDS   = /\b(amazing|absolutely|incredible|exceeded expectations|truly|seamlessly|testament|top-notch|phenomenal|outstanding|stellar|impeccable|unwavering|delightful|thrilled|blown away|exceptional|remarkable|superb|fantastic|wonderful|perfect|flawless|kudos|certainly|ensure|leverage|facilitate|robust|comprehensive|curated|bespoke|tailored|cutting-edge|state-of-the-art|world-class)\b/i
const STARTS_WITH_I  = /^i\b/i
const HAS_STRUCTURE  = /:\s|\n|\r|•|·|^\d+\./m

function isValid(text: string): boolean {
  if (!text || text.length < 35 || text.length > 700) return false
  if (BANNED_SYMBOLS.test(text))  return false
  if (BANNED_WORDS.test(text))    return false
  if (STARTS_WITH_I.test(text))   return false
  if (HAS_STRUCTURE.test(text))   return false
  return true
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You write Google reviews that sound exactly like a real customer typed them on their phone.

The review MUST be specifically about the service and qualities the customer selected.
The service tag is what the customer actually did or bought — it must be the main subject.
The category tags describe how it felt — weave them naturally into sentences, not as a list.

STRICT RULES:
- Output ONLY the review text. No labels, no quotes, no prefix, no explanation.
- No formatting. No bullet points, no numbered lists, no line breaks inside the review.
- No dashes at all — not hyphens, en-dashes or em-dashes. Zero.
- No forward slashes or backward slashes.
- No exclamation marks.
- Never start with "I".
- Do not start two sentences with "The".
- No AI words: amazing, absolutely, incredible, exceeded expectations, truly, seamlessly, testament, top-notch, phenomenal, outstanding, stellar, impeccable, unwavering, delightful, thrilled, blown away, exceptional, remarkable, superb, fantastic, wonderful, perfect, flawless.
- Sound like a real person — specific, informal, genuine.
- The review must clearly reflect the selected service and qualities. A reader should be able to guess what tags were selected just by reading it.`
}

// ─── User prompt ─────────────────────────────────────────────────────────────

function buildUserPrompt(
  businessName: string,
  serviceTag: string,
  categoryTags: string[],
  persona: typeof PERSONAS[number],
  opener: string,
  structure: string,
  detail: string,
  token: string,
): string {
  const categoryList = categoryTags.length > 0
    ? categoryTags.join(' and ')
    : 'good overall quality'

  return `[${token}] Write a Google review for ${businessName}.

THE CUSTOMER:
- Specifically came for: ${serviceTag}
- What they experienced: ${categoryList}

The review must be ABOUT "${serviceTag}" — this is what the customer actually did or bought.
The qualities (${categoryList}) should come through naturally in how you describe the experience.
Do NOT list the tags. Weave them into a natural story.

Write as: ${persona.desc}
Length: ${persona.length}
Sentence structure: ${structure}
Extra detail to include: ${detail}
Opening inspiration (adapt, do not copy): "${opener}…"

Output only the review text.`
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
    const rawTags  = (selected_tags as unknown[])
      .map(t => sanitizeForPrompt(String(t), 60))
      .filter(Boolean)

    if (!safeName || rawTags.length === 0) {
      return NextResponse.json({ data: { variants: pickFallbackPair() } })
    }

    // ── Split tags: first tag = service (main subject), rest = category qualities ──
    // The ReviewBuilder sends service tag first based on how the customer selected it.
    const serviceTag   = cleanTag(rawTags[0])
    const categoryTags = rawTags.slice(1).map(cleanTag).filter(Boolean)

    const systemPrompt = buildSystemPrompt()
    const [p1, p2]     = pickUnique(PERSONAS, 2)

    const structure1 = rand(SENTENCE_STRUCTURES)

    const configs = [
      {
        persona:   p1,
        opener:    rand(OPENERS),
        structure: structure1,
        detail:    rand(DETAIL_HINTS),
        token:     uniqueToken(),
        temp:      randTemp(0.88, 1.05),
      },
      {
        persona:   p2,
        opener:    rand(OPENERS),
        structure: rand(SENTENCE_STRUCTURES.filter(s => s !== structure1)),
        detail:    rand(DETAIL_HINTS),
        token:     uniqueToken(),
        temp:      randTemp(0.95, 1.15),
      },
    ] as const

    const variantPromises = configs.map(({ persona, opener, structure, detail, token, temp }, i) =>
      openai.chat.completions
        .create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: buildUserPrompt(safeName, serviceTag, categoryTags, persona, opener, structure, detail, token) },
          ],
          max_tokens: 220,
          temperature: temp,
          presence_penalty: 0.85,
          frequency_penalty: 0.75,
          seed: undefined,
        })
        .then(res => humanise(res.choices[0]?.message?.content?.trim() ?? ''))
        .catch(() => pickFallbackPair()[i])
    )

    let variants = await Promise.all(variantPromises)

    // Validate — retry once with fresh seeds if invalid
    variants = await Promise.all(
      variants.map(async (v, i) => {
        if (isValid(v)) return v
        try {
          const rp = rand(PERSONAS)
          const retry = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: buildUserPrompt(safeName, serviceTag, categoryTags, rp, rand(OPENERS), rand(SENTENCE_STRUCTURES), rand(DETAIL_HINTS), uniqueToken()) },
            ],
            max_tokens: 220,
            temperature: randTemp(1.0, 1.2),
            presence_penalty: 0.9,
            frequency_penalty: 0.85,
            seed: undefined,
          })
          const retried = humanise(retry.choices[0]?.message?.content?.trim() ?? '')
          return isValid(retried) ? retried : pickFallbackPair()[i]
        } catch {
          return pickFallbackPair()[i]
        }
      })
    )

    // Guarantee the two cards are different
    if (variants[0] === variants[1]) variants[1] = pickFallbackPair()[1]

    return NextResponse.json({ data: { variants } })

  } catch (error) {
    console.error('[POST /api/review/generate]', error)
    return NextResponse.json({
      data: { variants: pickFallbackPair() },
      warning: 'AI service issue — used fallback',
    })
  }
}
