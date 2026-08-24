/**
 * Supabase SERVICE ROLE client — ONLY for trusted server-side code.
 * This client BYPASSES Row Level Security entirely.
 * NEVER import this in client components or expose the key to the browser.
 * Used exclusively in Super Admin API routes.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Singleton — reuse the same instance across requests (server-side only)
let serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function createServiceRoleClient() {
  if (serviceClient) return serviceClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    )
  }

  serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceClient
}
