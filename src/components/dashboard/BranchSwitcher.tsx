'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, Check, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Business } from '@/types'

interface BranchSwitcherProps {
  currentBusiness: Business
  businesses: Business[]
}

export default function BranchSwitcher({ currentBusiness, businesses }: BranchSwitcherProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Single business: simple header display
  if (!businesses || businesses.length <= 1) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
            {currentBusiness.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Single Location</p>
        </div>
      </div>
    )
  }

  // Multi-business: Branch Switcher Dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'group flex items-center gap-3 p-2 pr-4 rounded-2xl transition-all duration-200 text-left border cursor-pointer',
          isOpen
            ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md'
            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
          <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
        </div>

        <div className="min-w-0 max-w-[200px] sm:max-w-[280px]">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {currentBusiness.name}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0',
                isOpen && 'rotate-180 text-blue-600'
              )}
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
            <Store className="h-3 w-3" />
            <span>Switch Branch ({businesses.length} locations)</span>
          </p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-fade-in-up"
        >
          <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            Select Location / Branch
          </div>

          <div className="py-1 max-h-64 overflow-y-auto space-y-1">
            {businesses.map((b) => {
              const isSelected = b.id === currentBusiness.id
              return (
                <button
                  key={b.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setIsOpen(false)
                    router.push(`/dashboard?businessId=${b.id}`)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs sm:text-sm group cursor-pointer',
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      )}
                    >
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{b.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">/{b.slug}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
