'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

interface UserMenuProps {
  email: string
  fullName: string | null
  role: UserRole
}

export default function UserMenu({ email, fullName, role }: UserMenuProps) {
  const router       = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = fullName || email.split('@')[0]
  const initials    = displayName
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const isAdmin    = role === 'super_admin'
  const roleLabel  = isAdmin ? 'Super Admin' : 'Business Owner'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await createClient().auth.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 h-9 px-2.5 rounded-xl border transition-all duration-200',
            'dark:border-slate-700/50 border-slate-200',
            'dark:hover:bg-slate-800/60 hover:bg-slate-50',
            'focus:outline-none'
          )}
          aria-label="User menu"
        >
          {/* Avatar */}
          <div className={cn(
            'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
            isAdmin
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          )}>
            {initials}
          </div>

          <span className="text-sm font-medium dark:text-slate-200 text-slate-700 hidden sm:block max-w-[100px] truncate">
            {displayName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 dark:text-slate-500 text-slate-400" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 dark:bg-slate-900 dark:border-slate-700/60"
      >
        <DropdownMenuLabel className="font-normal pb-2">
          <div className="flex flex-col gap-1">
            <span className="font-semibold dark:text-white text-slate-900 truncate text-sm">
              {displayName}
            </span>
            <span className="text-xs dark:text-slate-500 text-slate-400 truncate">{email}</span>
            <span className={cn(
              'w-fit text-xs mt-0.5 px-2 py-0.5 rounded-full border font-medium',
              isAdmin
                ? 'dark:border-purple-500/30 dark:text-purple-300 dark:bg-purple-500/10 border-purple-200 text-purple-700 bg-purple-50'
                : 'dark:border-blue-500/30 dark:text-blue-300 dark:bg-blue-500/10 border-blue-200 text-blue-700 bg-blue-50'
            )}>
              {roleLabel}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="dark:border-slate-700/60" />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-red-500 focus:text-red-500 dark:focus:bg-red-500/10 focus:bg-red-50 cursor-pointer"
          aria-label="Sign out"
        >
          {loggingOut
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            : <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          }
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
