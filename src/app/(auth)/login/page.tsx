import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import LoginForm from './LoginForm'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getAuthUser()
  if (auth) {
    if (auth.profile.role === 'super_admin') redirect('/admin')
    redirect('/dashboard')
  }

  const { redirectTo, error } = await searchParams

  return (
    <div className="space-y-6">
      {/* Logo — large, centered, with neon glow ring */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl scale-125" />
          <div className="relative w-36 h-36 rounded-full overflow-hidden ring-2 ring-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.35)]">
            <Image
              src="/logo.png"
              alt="Revora"
              fill
              sizes="144px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase text-blue-400/80">
            <span className="w-8 h-px bg-blue-500/40" />
            Collect · Analyze · Improve
            <span className="w-8 h-px bg-blue-500/40" />
          </div>
          <p className="text-xs text-slate-500">
            Let reviews drive your growth
          </p>
        </div>
      </div>

      {/* Login card */}
      <div className="glass-card-dark rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <LoginForm redirectTo={redirectTo} urlError={error} />
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Revora
      </p>
    </div>
  )
}
