import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client that uses the SERVICE_ROLE_KEY to bypass RLS.
 * Use this EXCLUSIVELY in Server Actions for administrative write operations.
 * DO NOT pass this client or its data directly to untrusted client components
 * without sanitization, as it can access all tables regardless of RLS.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
