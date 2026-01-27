import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validate Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.error('❌ Supabase credentials are missing!')
    console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
    console.error('Current values:')
    console.error('  VITE_SUPABASE_URL:', supabaseUrl || 'MISSING')
    console.error('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')
    console.error('\n📝 To fix this:')
    console.error('1. Open your .env file in the project root')
    console.error('2. Add your Supabase credentials:')
    console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co')
    console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here')
    console.error('3. Get these values from: Supabase Dashboard → Settings → API')
    console.error('4. Restart your dev server (npm run dev)')
  }
}

// Validate API key format (should start with 'eyJ' for JWT tokens)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️ Warning: Supabase anon key format looks incorrect. It should start with "eyJ"')
}

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null

// Create Supabase client with proper configuration (singleton)
export const supabase: SupabaseClient = (() => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
  })

  return supabaseInstance
})()
