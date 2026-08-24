/**
 * POST /api/review/generate
 *
 * Generates 2 unique, human-sounding Google reviews every single call.
 *
 * KEY IMPROVEMENT: The review is always specific to the business type and
 * the exact tags the customer selected. A jeweller gets jewellery language.
 * A cafe gets food/ambience language. Tags are woven naturally into sentences,
 * not listed. Same tags selected 1000 times = 1000 different reviews.
 *
 * UNIQUENESS LAYERS:
 *  1. Business-type context inferred from name + tags → domain-specific language
 *  2. Tags rewritten as natural descriptive phrases before injection
 *  3. Unique entropy token per call → GPT cache busted every time
 *  4. 10 personas × 30 openers × 20 angles × 16 detail hints → massive variety
 *  5. Randomised temperature per variant
 *  6. seed: undefined → OpenAI never returns cached response
 *  7. 16-variant diverse fallback pool, randomly paired
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
    description: 'a busy parent in their late 30s, types quickly on their phone, brief and genuine, warm but no fuss',
    length: '1 to 2 short sentences, under 50 words',
    tone: 'matter-of-fact, genuine',
  },
  {
    id: 'local-regular',
    description: 'a local resident who visits many places and knows quality when they see it, shares a small personal observation',
    length: '2 to 3 sentences, 55 to 90 words',
    tone: 'natural, grounded, occasionally uses "honestly" or "to be fair"',
  },
  {
    id: 'first-timer',
    description: 'someone visiting for the first time who was pleasantly surprised, mentions one specific thing that stood out',
    length: '2 sentences, 40 to 65 words',
    tone: 'slightly surprised but measured, writes like texting a friend',
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
    description: 'a person in their mid-20s, casually mentions value for money, writes like a WhatsApp message',
    length: '2 sentences, 35 to 65 words',
    tone: 'relaxed and honest, uses "pretty" or "actually" naturally',
  },
  {
    id: 'loyal-customer',
    description: 'someone who has visited a few times and keeps coming back, mentions returning and why',
    length: '2 to 3 sentences, 50 to 80 words',
    tone: 'familiar, comfortable, loyal without being gushing',
  },
  {
    id: 'referred-visitor',
    description: 'someone who came based on a friend\'s recommendation and is glad they did',
    length: '2 sentences, 45 to 70 words',
    tone: 'grateful, validates the recommendation, natural',
  },
  {
    id: 'skeptic-converted',
    description: 'someone who was unsure at first but ended up having a genuinely good experience',
    length: '2 sentences, 50 to 75 words',
    tone: 'honest and slightly surprised, credible because it admits initial doubt',
  },
  {
    id: 'comparison-shopper',
    description: 'someone who has tried several similar places and compares this one favourably without naming competitors',
    length: '2 sentences, 50 to 80 words',
    tone: 'informed, measured, specific about what sets this place apart',
  },
]

// ─── Opener pool (30) ─────────────────────────────────────────────────────────

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
  'Honestly just needed somewhere good',
  'Was passing by and decided to stop in',
  'Had heard good things for a while',
  'Came back for the second time',
  'Tried this after seeing it online',
  'Booked this after looking around',
  'Had been meaning to visit for ages',
  'Walked past a few times and finally went in',
  'Came here with a colleague',
  'Was referred by someone I trust',
  'Visited on a busy Saturday',
  'Came in not expecting much honestly',
  'Tried several places before settling here',
  'Went here instead of somewhere I usually go',
  'Came back after a good first visit',
  'Stopped by on a quiet weekday',
  'Gave this place a go last week',
  'Was looking for somewhere good nearby',
]

// ─── Narrative angles (20) ───────────────────────────────────────────────────

const ANGLES = [
  'Focus on how the customer felt while they were there.',
  'Mention one specific small detail that made the experience stand out.',
  'Compare briefly to other similar places without naming them.',
  'Talk about whether the customer would come back and why.',
  'Describe the experience as a sequence of small moments.',
  'Focus on the people and how they made the customer feel.',
  'Talk about the overall value relative to what was expected.',
  'Focus on one of the selected qualities and explain it through experience.',
  'Mention telling a friend or family member about this place.',
  'Talk about first impressions and how they played out.',
  'Focus on what makes this place different from expectations.',
  'Mention how easy or smooth the whole thing was.',
  'Talk about what the customer will remember.',
  'Focus on the reliability or consistency.',
  'Mention how the customer felt leaving compared to arriving.',
  'Talk about what was specifically noticed about the quality.',
  'Focus on how the customer felt they were treated as a person.',
  'Mention something that exceeded what you get at most places.',
  'Talk about how this place compares to the customer\'s own standards.',
  'Mention a moment where the staff went slightly beyond what was needed.',
]

// ─── Detail hints (16) ───────────────────────────────────────────────────────

const DETAIL_INSTRUCTIONS = [
  'Mention a small sensory detail like how the place looked or felt.',
  'Include a brief time reference like "on a weekday" or "in the afternoon".',
  'Mention how long it took or how efficient things were.',
  'Include a small observation about the atmosphere.',
  'Mention whether the customer felt rushed or at ease.',
  'Include a passing mention of who they came with.',
  'Mention a brief moment of doubt that was quickly resolved.',
  'Mention how the customer felt when they first arrived.',
  'Include a small note about how the staff communicated.',
  'Reference that everything was as described or expected.',
  'Mention a specific aspect that was unexpectedly good.',
  'Include a brief note about ease of the overall process.',
  'Mention a small thing that showed care or attention to detail.',
  'Reference how welcoming the environment felt.',
  'Mention how the customer felt their needs were understood.',
  'Include a note about how the experience compared to what they paid.',
]

// ─── Business type detector ───────────────────────────────────────────────────
// Reads the business name + tags to figure out what kind of business it is.
// This is the key fix — it makes the AI write domain-specific language.

const BUSINESS_CONTEXTS: Array<{
  keywords: RegExp
  context: string
  tagTranslations: Record<string, string>
}> = [
  {
    keywords: /jewel|jeweller|jewellery|jewelry|gold|diamond|ring|necklace|bangle|pendant|gems|ornament/i,
    context: 'a jewellery shop or jeweller',
    tagTranslations: {
      'premium quality':       'the quality of the jewellery pieces',
      'reliable':              'being able to trust the pieces they sell',
      'trustworthy':           'feeling confident about the authenticity and quality',
      'good people':           'the staff who helped with the selection',
      'great experience':      'the overall experience of browsing and buying jewellery',
      'professional team':     'how knowledgeable the staff were about the jewellery',
      'on-time delivery':      'getting the piece ready or delivered on time',
      'work completed successfully': 'the piece being exactly right when it was ready',
      'reliable service':      'the service being dependable throughout',
      'good place':            'the showroom feeling comfortable and well-presented',
    },
  },
  {
    keywords: /cafe|coffee|restaurant|food|eat|dining|bakery|bar|bistro|kitchen|pizza|burger/i,
    context: 'a food and beverage establishment',
    tagTranslations: {
      'fast service':    'how quickly the food and drinks arrived',
      'great ambience':  'the atmosphere and feel of the place',
      'excellent food':  'the quality and taste of the food',
      'friendly staff':  'how warm and attentive the staff were',
      'good value':      'the value for money on the menu',
      'clean and tidy':  'how clean the space and tables were',
    },
  },
  {
    keywords: /salon|hair|beauty|spa|nail|massage|skin|facial|barber/i,
    context: 'a beauty salon or spa',
    tagTranslations: {
      'premium quality':   'the quality of the treatment',
      'professional team': 'how skilled and trained the therapists were',
      'reliable service':  'being able to trust the results',
      'good people':       'how welcoming and attentive the staff were',
    },
  },
  {
    keywords: /clinic|doctor|dental|dentist|physio|health|medical|hospital/i,
    context: 'a healthcare or medical practice',
    tagTranslations: {
      'trustworthy':       'feeling confident in the care provided',
      'professional team': 'the expertise and manner of the practitioners',
      'reliable service':  'the consistency and dependability of the care',
      'on-time delivery':  'appointments running to time',
    },
  },
  {
    keywords: /gym|fitness|yoga|pilates|sport|training|coach|personal trainer/i,
    context: 'a fitness or gym facility',
    tagTranslations: {
      'professional team': 'how knowledgeable the trainers and coaches were',
      'great experience':  'how motivating and well-run the sessions were',
      'reliable service':  'the consistency of the classes and equipment',
      'good place':        'the cleanliness and setup of the facility',
    },
  },
]

function getBusinessContext(businessName: string, tags: string[]): {
  contextPhrase: string
  tagDescriptions: string
} {
  const combined = businessName + ' ' + tags.join(' ')

  // Try to match a known business type
  for (const bc of BUSINESS_CONTEXTS) {
    if (bc.keywords.test(combined)) {
      // Translate known tags into domain-specific descriptions
      const translated = tags.map(tag => {
        const lower = tag.toLowerCase().replace(/[^a-z\s]/g, '').trim()
        return bc.tagTranslations[lower] ?? tag.replace(/^[^\w]+/, '').trim()
      })
      return {
        contextPhrase: bc.context,
        tagDescriptions: translated.filter(Boolean).join(', '),
      }
    }
  }

  // Generic fallback — strip emoji from tags and use them as-is
  const cleanTags = tags.map(t => t.replace(/^[^\w]+/, '').trim()).filter(Boolean)
  return {
    contextPhrase: 'a local business',
    tagDescriptions: cleanTags.join(', '),
  }
}

// ─── Fallback pool (16) ──────────────────────────────────────────────────────

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

CRITICAL RULES — breaking any makes the review unusable:
- Output ONLY the review text. No labels, no quotes, no explanation.
- No formatting. No bullet points, no line breaks, no numbered lists.
- No dashes of any kind. Not hyphens, not en-dashes, not em-dashes. Zero.
- No forward slashes or backward slashes.
- No colon constructions like "service: great".
- No exclamation marks.
- Never use: amazing, absolutely, incredible, exceeded expectations, truly, seamlessly, testament, top-notch, phenomenal, outstanding, stellar, impeccable, unwavering, delightful, thrilled, blown away, exceptional, remarkable, superb, fantastic, wonderful, perfect, flawless, kudos, certainly, ensure, leverage, facilitate, robust, comprehensive, curated, bespoke, tailored, cutting-edge, state-of-the-art, world-class.
- Never start with "I".
- Do not start two sentences with "The".
- No corporate or marketing language.
- Sound like a real person on their phone — informal, genuine, specific to this type of business.`
}

// ─── User prompt ──────────────────────────────────────────────────────────────

function buildUserPrompt(
  safeName: string,
  contextPhrase: string,
  tagDescriptions: string,
  persona: typeof PERSONAS[number],
  opener: string,
  angle: string,
  detail: string,
  token: string,
): string {
  return `Session ${token} — write a Google review for a customer who visited ${safeName}, which is ${contextPhrase}.

The customer specifically wants to mention: ${tagDescriptions}

IMPORTANT: The review must sound like it is specifically about ${contextPhrase}. Use natural language that fits this type of business. Do not write a generic review — make it clear from the wording what kind of place this is.

Write as: ${persona.description}
Length: ${persona.length}
Tone: ${persona.tone}
How to open (adapt naturally, do not copy): "${opener}…"
Narrative angle: ${angle}
Extra detail: ${detail}

Output only the review text. Make the selected qualities feel like natural parts of the story, not a checklist.`
}

// ─── Validation ──────────────────────────────────────────────────────────────

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

    // ── KEY: detect business type + translate tags into domain language ──
    const { contextPhrase, tagDescriptions } = getBusinessContext(safeName, safeTags)

    const systemPrompt = buildSystemPrompt()

    const [p1, p2] = pickUnique(PERSONAS, 2)
    const o1 = rand(OPENERS)
    const o2 = rand(OPENERS.filter(o => o !== o1))
    const a1 = rand(ANGLES)
    const a2 = rand(ANGLES.filter(a => a !== a1))
    const d1 = rand(DETAIL_INSTRUCTIONS)
    const d2 = rand(DETAIL_INSTRUCTIONS.filter(d => d !== d1))

    const configs = [
      { persona: p1, opener: o1, angle: a1, detail: d1, token: uniqueToken(), temp: randTemp(0.88, 1.05) },
      { persona: p2, opener: o2, angle: a2, detail: d2, token: uniqueToken(), temp: randTemp(0.95, 1.15) },
    ]

    const variantPromises = configs.map(({ persona, opener, angle, detail, token, temp }, i) =>
      openai.chat.completions
        .create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: buildUserPrompt(safeName, contextPhrase, tagDescriptions, persona, opener, angle, detail, token) },
          ],
          max_tokens: 220,
          temperature: temp,
          presence_penalty: 0.9,
          frequency_penalty: 0.8,
          seed: undefined,
        })
        .then(res => humanise(res.choices[0]?.message?.content?.trim() ?? ''))
        .catch(() => pickFallbackPair()[i])
    )

    let variants = await Promise.all(variantPromises)

    // Validate + retry once if needed
    variants = await Promise.all(
      variants.map(async (v, i) => {
        if (isValid(v)) return v
        try {
          const retry = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: buildUserPrompt(safeName, contextPhrase, tagDescriptions, rand(PERSONAS), rand(OPENERS), rand(ANGLES), rand(DETAIL_INSTRUCTIONS), uniqueToken()) },
            ],
            max_tokens: 220,
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

    if (variants[0] === variants[1]) variants[1] = pickFallbackPair()[1]

    return NextResponse.json({ data: { variants } })

  } catch (error) {
    console.error('[POST /api/review/generate]', error)
    return NextResponse.json({
      data: { variants: pickFallbackPair() },
      warning: 'Used fallback reviews due to AI service issue',
    })
  }
}
