'use client'

import { useState } from 'react'
import FeedbackInbox from './FeedbackInbox'
import TagsManager from './TagsManager'
import QRCodeDisplay from './QRCodeDisplay'
import { MessageSquare, Tag, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Feedback, ServiceTag } from '@/types'

interface DashboardTabsProps {
  feedback: Feedback[]
  tags: ServiceTag[]
  openCount: number
}

const TABS = [
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'text-orange-400', glow: 'shadow-orange-500/20' },
  { id: 'tags',     label: 'Tags',     icon: Tag,           color: 'text-blue-400',   glow: 'shadow-blue-500/20'   },
  { id: 'qr',       label: 'QR Code',  icon: QrCode,        color: 'text-purple-400', glow: 'shadow-purple-500/20' },
] as const

type TabId = typeof TABS[number]['id']

export default function DashboardTabs({ feedback, tags, openCount }: DashboardTabsProps) {
  const [active, setActive] = useState<TabId>('feedback')

  const activeTab = TABS.find(t => t.id === active)!

  return (
    <div className="space-y-4">

      {/* ── Custom animated tab bar ── */}
      <div className="relative flex gap-1 p-1 rounded-2xl bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer select-none',
                isActive
                  ? `text-white`
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
              )}
              aria-selected={isActive}
              role="tab"
            >
              {/* Active pill background */}
              {isActive && (
                <span
                  className={cn(
                    'absolute inset-0 rounded-xl bg-gradient-to-r opacity-100 transition-all duration-300',
                    tab.id === 'feedback' && 'from-orange-500/20 to-orange-600/10 border border-orange-500/25',
                    tab.id === 'tags'     && 'from-blue-500/20 to-blue-600/10 border border-blue-500/25',
                    tab.id === 'qr'       && 'from-purple-500/20 to-purple-600/10 border border-purple-500/25',
                  )}
                  aria-hidden="true"
                />
              )}

              <span className="relative flex items-center gap-2">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-all duration-300',
                    isActive ? tab.color : 'text-slate-500',
                    isActive && 'scale-110'
                  )}
                  aria-hidden="true"
                />
                <span className="hidden sm:block">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>

                {/* Notification dot for feedback */}
                {tab.id === 'feedback' && openCount > 0 && (
                  <span className="relative flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-40" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 text-[9px] font-bold text-white items-center justify-center">
                      {openCount > 9 ? '9+' : openCount}
                    </span>
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Tab content with fade-in animation ── */}
      <div
        key={active}
        className="animate-fade-in-up dashboard-card rounded-2xl overflow-hidden"
      >
        {/* Card header with colored accent */}
        <div className={cn(
          'px-4 sm:px-5 pt-4 sm:pt-5 pb-3.5 border-b border-slate-800/60 flex items-center gap-3',
        )}>
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
            active === 'feedback' && 'bg-orange-500/15 border border-orange-500/20',
            active === 'tags'     && 'bg-blue-500/15 border border-blue-500/20',
            active === 'qr'       && 'bg-purple-500/15 border border-purple-500/20',
          )}>
            <activeTab.icon className={cn('h-4 w-4', activeTab.color)} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {active === 'feedback' && 'Private Feedback'}
              {active === 'tags'     && 'Service Tags'}
              {active === 'qr'       && 'Your QR Code'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {active === 'feedback' && '1–3 star responses visible only to you — never posted publicly'}
              {active === 'tags'     && 'Appear on your review page for customers to select (up to 3)'}
              {active === 'qr'       && 'Display at your location — customers scan to leave a review'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-5 py-4 sm:py-5">
          {active === 'feedback' && <FeedbackInbox items={feedback} />}
          {active === 'tags'     && <TagsManager tags={tags} />}
          {active === 'qr'       && <QRCodeDisplay />}
        </div>
      </div>
    </div>
  )
}
