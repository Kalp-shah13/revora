/**
 * Auth layout — theme-aware background with animated orbs.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg-dark min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-500">
      {/* Animated orbs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-40 w-[700px] h-[700px] rounded-full
          dark:bg-blue-600/20 bg-blue-400/15 blur-[140px] animate-orb-1" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full
          dark:bg-purple-600/20 bg-purple-400/12 blur-[120px] animate-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full
          dark:bg-cyan-500/10 bg-cyan-400/8 blur-[100px] animate-orb-3" />
        {/* Grid overlay */}
        <div className="absolute inset-0
          dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]
          bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]
          bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        {children}
      </div>
    </div>
  )
}
