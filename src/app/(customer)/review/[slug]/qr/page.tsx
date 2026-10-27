import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { getBusinessBySlug } from '@/lib/db'
import { getReviewPageUrl } from '@/lib/utils'
import { Star } from 'lucide-react'
import QRPrintButton from '@/components/review/QRPrintButton'

interface QRPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Print-friendly QR code page at /review/[slug]/qr
 * Designed to be printed and displayed in the business location.
 */
export default async function QRPrintPage({ params }: QRPageProps) {
  const { slug } = await params
  const business = await getBusinessBySlug(null, slug)
  if (!business) notFound()

  const reviewUrl = getReviewPageUrl(slug)
  const accentColor = business.accent_color || '#D97706'

  // Generate a large high-quality QR for print
  const pngDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 400,
    margin: 3,
    color: { dark: '#0F172A', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  })

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 print:p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Business brand */}
        <div className="space-y-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: accentColor + '20' }}
          >
            <Star
              className="w-7 h-7"
              style={{ color: accentColor, fill: accentColor }}
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
        </div>

        {/* Call to action */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: accentColor + '10', border: `2px solid ${accentColor}30` }}
        >
          <p className="text-lg font-semibold text-slate-800">
            Enjoyed your visit?
          </p>
          <p className="text-sm text-slate-600">
            Scan to leave us a Google review — it only takes 30 seconds!
          </p>

          {/* QR code */}
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pngDataUrl}
                alt={`QR code to review ${business.name}`}
                width={240}
                height={240}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Stars decoration */}
        <div className="flex justify-center gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Print button — hidden when printing */}
        <div className="pt-2">
          <QRPrintButton />
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

export async function generateMetadata({ params }: QRPageProps) {
  const { slug } = await params
  return {
    title: `QR Code — ${slug}`,
    description: 'Print this QR code and display it at your location',
  }
}
