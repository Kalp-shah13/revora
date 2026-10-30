import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import '@/lib/performance-patch'
import './globals.css'

export const metadata: Metadata = {
  title: 'Revora — AI Review & Reputation Platform',
  description:
    'Collect more Google reviews and privately capture negative feedback — powered by AI.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased light" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground font-body">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
