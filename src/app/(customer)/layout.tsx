/**
 * Customer route group layout.
 * Minimal, mobile-first — no auth required, no navigation.
 * This wraps /review/[slug] pages only.
 */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>
}
