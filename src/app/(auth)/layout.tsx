/**
 * Auth layout — theme-aware background with animated orbs.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg-dark min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-500">
      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        {children}
      </div>
    </div>
  )
}
