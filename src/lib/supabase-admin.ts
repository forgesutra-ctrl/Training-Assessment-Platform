import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Admin client for server-side-only operations (e.g. set user password).
 * Only available when VITE_SUPABASE_SERVICE_ROLE_KEY is set (e.g. in development or a secure backend).
 * Never expose the service role key in production client bundles.
 */
let adminInstance: SupabaseClient | null = null

export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!supabaseUrl || !serviceRoleKey) return null
  if (adminInstance) return adminInstance
  adminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return adminInstance
}

export const hasAdminAuth = (): boolean => !!serviceRoleKey
