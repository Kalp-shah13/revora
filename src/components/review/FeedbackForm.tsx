'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FeedbackFormProps {
  businessId: string
  rating: number
  onSubmitted: () => void
}

export default function FeedbackForm({ businessId, rating, onSubmitted }: FeedbackFormProps) {
  const [message, setMessage] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!message.trim()) {
      setError('Please tell us what went wrong so we can improve.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          rating,
          message: message.trim(),
          contact_info: contactInfo.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit feedback')
      }

      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="feedback-message">
          What could we have done better?
          <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
        </Label>
        <Textarea
          id="feedback-message"
          placeholder="Tell us what went wrong or how we can improve…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          disabled={isSubmitting}
          required
          aria-required="true"
          maxLength={1000}
          className="resize-none text-sm"
        />
        <p className="text-xs text-slate-400 text-right">{message.length}/1000</p>
      </div>

      {/* Optional contact */}
      <div className="space-y-1.5">
        <Label htmlFor="feedback-contact" className="flex items-center gap-1">
          Contact info
          <span className="text-xs text-slate-400 font-normal">(optional — if you'd like us to follow up)</span>
        </Label>
        <Input
          id="feedback-contact"
          type="text"
          placeholder="Email or phone number"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          disabled={isSubmitting}
          maxLength={200}
          className="h-10 text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting || !message.trim()}
        className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-base"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            Send Feedback
          </>
        )}
      </Button>
    </form>
  )
}
