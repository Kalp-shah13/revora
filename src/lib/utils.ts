import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a URL-safe slug from a business name.
 * e.g. "Joe's Cafe & Grill" → "joes-cafe-grill"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '-')         // spaces to hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
}

/**
 * Format a number as a percentage string.
 * e.g. 0.764 → "76.4%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format a rating as a display string.
 * e.g. 4.33333 → "4.3"
 */
export function formatRating(value: number): string {
  return value.toFixed(1)
}

/**
 * Sanitize user-submitted text before including it in AI prompts.
 * Strips prompt injection patterns and limits length.
 */
export function sanitizeForPrompt(input: string, maxLength = 200): string {
  return input
    .slice(0, maxLength)
    // Strip common injection patterns
    .replace(/ignore (previous|above|all) instructions?/gi, '')
    .replace(/you are now/gi, '')
    .replace(/system:/gi, '')
    .replace(/assistant:/gi, '')
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .replace(/<\/?[^>]+(>|$)/g, '') // strip HTML tags
    .trim()
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Uses Node.js crypto.timingSafeEqual under the hood.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const { timingSafeEqual: cryptoEqual } = require('crypto')
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return cryptoEqual(bufA, bufB)
}

/**
 * Extract the public URL for the review page from a business slug.
 */
export function getReviewPageUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${baseUrl}/review/${slug}`
}

/**
 * Robust universal clipboard copy helper.
 * Works across desktop, mobile browsers, HTTPS, and non-HTTPS LAN IP (http://192.168.x.x)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const clean = text.trim()
  if (!clean) return false

  // 1. Try modern Clipboard API if available and context is secure
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined' && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(clean)
      return true
    } catch {
      // Fall through to legacy execCommand
    }
  }

  // 2. Universal fallback using textarea + execCommand for HTTP/LAN mobile
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = clean
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      textarea.setSelectionRange(0, clean.length)
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    } catch {
      return false
    }
  }

  return false
}

