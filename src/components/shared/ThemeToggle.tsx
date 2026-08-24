'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex items-center w-14 h-7 rounded-full p-0.5 transition-all duration-500 shrink-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isDark
          ? 'bg-slate-700 border border-slate-600'
          : 'bg-blue-100 border border-blue-200'
      )}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <Moon
          className={cn(
            'h-3.5 w-3.5 transition-all duration-300',
            isDark ? 'text-blue-300 opacity-100' : 'text-slate-400 opacity-40'
          )}
          aria-hidden="true"
        />
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <Sun
          className={cn(
            'h-3.5 w-3.5 transition-all duration-300',
            !isDark ? 'text-amber-500 opacity-100' : 'text-slate-500 opacity-40'
          )}
          aria-hidden="true"
        />
      </span>

      {/* Thumb */}
      <span
        className={cn(
          'relative z-10 w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-all duration-500',
          isDark
            ? 'translate-x-0 bg-slate-900 shadow-slate-900/50'
            : 'translate-x-7 bg-white shadow-blue-200/60'
        )}
        aria-hidden="true"
      >
        {isDark
          ? <Moon className="h-3 w-3 text-blue-400" aria-hidden="true" />
          : <Sun  className="h-3 w-3 text-amber-500" aria-hidden="true" />
        }
      </span>
    </button>
  )
}
