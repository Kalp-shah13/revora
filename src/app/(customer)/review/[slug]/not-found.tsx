import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function ReviewNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8 text-slate-400" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">
            This review page is no longer active
          </h1>
          <p className="text-sm text-slate-500">
            The link you scanned may be outdated or the business may have changed their settings.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          If you believe this is an error, please ask the business for an updated QR code.
        </p>
      </div>
    </div>
  )
}
