import Link from 'next/link'
import Image from 'next/image'
import UserMenu from './UserMenu'
import ThemeToggle from './ThemeToggle'
import type { UserRole } from '@/types'

interface TopNavProps {
  email: string
  fullName: string | null
  role: UserRole
}

export default function TopNav({ email, fullName, role }: TopNavProps) {
  const homeHref = role === 'super_admin' ? '/admin' : '/dashboard'

  return (
    <header className="
      h-14 sticky top-0 z-40 shrink-0
      flex items-center px-3 sm:px-4 md:px-6 gap-3
      border-b backdrop-blur-md transition-colors duration-300
      dark:bg-slate-950/85 dark:border-slate-800/60
      bg-white/90 border-slate-200
    ">
      {/* Brand */}
      <Link
        href={homeHref}
        className="flex items-center gap-2.5 mr-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg min-h-0"
        aria-label="ReviewFlow AI — go to home"
      >
        <div className="relative w-8 h-8 shrink-0">
          <Image
            src="/logo.png"
            alt="ReviewFlow AI"
            fill
            sizes="32px"
            className="object-cover rounded-full ring-1 ring-blue-500/30"
          />
        </div>
        <span className="font-bold text-sm hidden sm:block tracking-tight dark:text-white text-slate-900">
          ReviewFlow <span className="text-blue-500 dark:text-blue-400">AI</span>
        </span>
        {role === 'super_admin' && (
          <span className="text-xs font-semibold hidden sm:block px-2 py-0.5 rounded-full
            dark:text-blue-300 dark:bg-blue-500/15 dark:border dark:border-blue-500/30
            text-blue-700 bg-blue-50 border border-blue-200">
            Admin
          </span>
        )}
      </Link>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User menu */}
      <UserMenu email={email} fullName={fullName} role={role} />
    </header>
  )
}
