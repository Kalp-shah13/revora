/**
 * Supabase ANON client — safe to use in browser and public API routes.
 * RLS policies are enforced on all queries made with this client.
 * Never use service-role key here.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
