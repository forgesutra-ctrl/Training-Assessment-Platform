import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validate Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  const isDev = import.meta.env.DEV
  const isProd = import.meta.env.PROD
  
  console.error('❌ Supabase credentials are missing!')
  console.error('Current values:')
  console.error('  VITE_SUPABASE_URL:', supabaseUrl || 'MISSING')
  console.error('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')
  
  if (isDev) {
    console.error('\n📝 To fix this (Development):')
    console.error('1. Open your .env file in the project root')
    console.error('2. Add your Supabase credentials:')
    console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co')
    console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here')
    console.error('3. Get these values from: Supabase Dashboard → Settings → API')
    console.error('4. Restart your dev server (npm run dev)')
  }
  
  if (isProd) {
    console.error('\n📝 To fix this (Production/Vercel):')
    console.error('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
    console.error('2. Add these variables:')
    console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co')
    console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here')
    console.error('3. Make sure to select ALL environments (Production, Preview, Development)')
    console.error('4. Click Save, then redeploy your project')
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

  // Use sessionStorage instead of localStorage to prevent persistent cache issues
  // sessionStorage clears when browser closes, preventing stale auth data
  const customStorage = typeof window !== 'undefined' ? {
    getItem: (key: string) => {
      try {
        const value = window.sessionStorage.getItem(key)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:56',message:'sessionStorage.getItem',data:{key,hasValue:!!value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return value
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:60',message:'sessionStorage.getItem error',data:{key,error:e?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.sessionStorage.setItem(key, value)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:67',message:'sessionStorage.setItem',data:{key,valueLength:value?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:71',message:'sessionStorage.setItem error',data:{key,error:e?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // Ignore quota errors
      }
    },
    removeItem: (key: string) => {
      try {
        window.sessionStorage.removeItem(key)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:78',message:'sessionStorage.removeItem',data:{key},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:82',message:'sessionStorage.removeItem error',data:{key,error:e?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // Ignore errors
      }
    },
  } : undefined

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: customStorage,
      storageKey: 'sb-auth-token',
      // Don't block on refresh token errors - allow login to proceed
      flowType: 'pkce',
    },
  })

  return supabaseInstance
})()
