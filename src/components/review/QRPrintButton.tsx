'use client'

import { Printer } from 'lucide-react'

export default function QRPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-95 cursor-pointer"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Print Stand Display</span>
    </button>
  )
}
