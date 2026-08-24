'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  redirectTo?: string
  urlError?: string
}

export default function LoginForm({ redirectTo, urlError }: LoginFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(urlError ?? null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required'); return }
    if (!password)     { setError('Password is required'); return }

    startTransition(async () => {
      try {
        const supabase = createClient()

        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (signInError) {
          if (
            signInError.message.includes('Invalid login credentials') ||
            signInError.message.includes('invalid_credentials')
          ) {
            setError('Incorrect email or password. Please try again.')
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Please confirm your email address before signing in.')
          } else if (signInError.message.includes('Too many requests')) {
            setError('Too many login attempts. Please wait a moment and try again.')
          } else {
            setError(signInError.message)
          }
          return
        }

        if (!authData.user) { setError('Sign in failed. Please try again.'); return }

        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profileRow) {
          setError('Account profile not found. Please contact support.')
          return
        }

        const profile = profileRow as unknown as { role: string }

        const destination =
          redirectTo && redirectTo.startsWith('/')
            ? redirectTo
            : profile.role === 'super_admin'
            ? '/admin'
            : '/dashboard'

        router.push(destination)
        router.refresh()
      } catch {
        setError('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="p-7 space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold dark:text-white text-slate-900">Welcome back</h2>
        <p className="text-sm dark:text-slate-400 text-slate-500">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-3 text-sm text-red-300 animate-shake"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className={cn(
              'block text-xs font-semibold uppercase tracking-wider transition-colors duration-200',
              emailFocused ? 'text-blue-400' : 'text-slate-400'
            )}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="owner@test.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            disabled={isPending}
            required
            className={cn(
              'w-full h-12 px-4 rounded-xl border text-sm font-medium placeholder:text-slate-500',
              'dark:bg-slate-900/50 dark:text-white bg-white text-slate-900',
              'transition-all duration-200 outline-none',
              'focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
              emailFocused ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'dark:border-slate-700/50 border-slate-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className={cn(
              'block text-xs font-semibold uppercase tracking-wider transition-colors duration-200',
              passwordFocused ? 'text-blue-400' : 'text-slate-400'
            )}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              disabled={isPending}
              required
              className={cn(
                'w-full h-12 px-4 pr-12 rounded-xl border text-sm font-medium placeholder:text-slate-500',
                'dark:bg-slate-900/50 dark:text-white bg-white text-slate-900',
                'transition-all duration-200 outline-none',
                'focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
                passwordFocused ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'dark:border-slate-700/50 border-slate-300',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none min-h-0"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword
                ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                : <Eye className="h-4 w-4" aria-hidden="true" />
              }
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full h-12 rounded-xl font-semibold text-sm text-white',
            'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500',
            'hover:from-blue-500 hover:via-blue-400 hover:to-cyan-400',
            'active:scale-[0.98]',
            'shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
            'flex items-center justify-center gap-2 group'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
