import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: SupabaseUser | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'manager' | 'trainer') => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string, autoCreate: boolean = true): Promise<Profile | null> => {
    try {
      // Ensure we have a valid session before querying
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Error getting session:', sessionError)
        return null
      }
      
      if (!currentSession) {
        console.warn('⚠️ No active session when fetching profile')
        console.warn('   This means the user is not authenticated')
        return null
      }
      
      if (currentSession.user.id !== userId) {
        console.warn('⚠️ Session user ID mismatch:', {
          requestedUserId: userId,
          sessionUserId: currentSession.user.id,
        })
      }
      
      console.log('🔍 Fetching profile with session:', {
        userId: userId,
        sessionUserId: currentSession.user.id,
        match: userId === currentSession.user.id,
        hasAccessToken: !!currentSession.access_token,
        tokenLength: currentSession.access_token?.length || 0,
      })
      
      // Use the session's user ID to ensure RLS policy works
      // The RLS policy checks auth.uid() = id, so we must query with the session user's ID
      const profileUserId = currentSession.user.id
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileUserId)  // Use session user ID, not the passed userId
        .single()

      if (error) {
        // Ignore AbortError
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          return null
        }
        
        // Log ALL errors to console for debugging (don't suppress)
        console.error('❌ Profile fetch error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: userId,
          sessionUserId: currentSession?.user?.id,
        })
        
        // If profile not found and autoCreate is enabled, try to create it
        if (error.code === 'PGRST116' && autoCreate) {
          console.warn('⚠️ Profile not found for user:', userId)
          console.log('💡 Attempting to auto-create profile...')
          
          // Get user info from auth
          const { data: authData } = await supabase.auth.getUser()
          if (authData?.user) {
            const email = authData.user.email || ''
            // Try both user_metadata and raw_user_meta_data
            const fullName = authData.user.user_metadata?.full_name || 
                           authData.user.user_metadata?.fullName ||
                           email.split('@')[0].replace(/\./g, ' ')
            const role = authData.user.user_metadata?.role || 'trainer'
            
            // Try to create profile
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: fullName,
                role: role,
                team_id: null,
                reporting_manager_id: null,
              })
              .select()
              .single()
            
            if (createError) {
              console.error('❌ Failed to auto-create profile:', {
                code: createError.code,
                message: createError.message,
                details: createError.details,
                hint: createError.hint,
              })
              
              if (createError.code === '42501' || createError.message?.includes('permission denied')) {
                console.error('💡 RLS Policy Issue: User cannot insert their own profile')
                console.error('   Solution: Run this SQL in Supabase SQL Editor:')
                console.error('   See: migrations/create-missing-profiles.sql')
              } else {
                console.error('💡 Please run the seed script or create profile manually in Supabase')
                console.error('   See: PROFILE_NOT_FOUND_FIX.md for instructions')
              }
              return null
            }
            
            console.log('✅ Profile auto-created successfully:', newProfile)
            return newProfile as Profile
          }
        }
        
        console.error('❌ Error fetching profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          requestedUserId: userId,
          sessionUserId: currentSession?.user?.id,
        })
        
        // Provide helpful hints based on error code
        if (error.code === 'PGRST116') {
          console.error('💡 Profile not found (PGRST116). This means:')
          console.error('   1. Profile record does not exist in database, OR')
          console.error('   2. RLS policy is blocking access (auth.uid() does not match profile id)')
          console.error('   Check: Does profile exist? Run diagnostic query.')
          console.error('   Check: Does session user ID match profile ID?')
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.error('💡 Permission denied (42501). RLS policy is blocking access.')
          console.error('   This means auth.uid() is not matching the profile id.')
          console.error('   Session user ID:', currentSession?.user?.id)
          console.error('   Requested profile ID:', userId)
          console.error('   Check: Is the session token being sent with the request?')
        }
        
        return null
      }

      if (!data) {
        console.warn('⚠️ Profile query returned no data for user:', userId)
        console.warn('💡 This might mean:')
        console.warn('   1. Profile record exists but is NULL')
        console.warn('   2. RLS policy is blocking access')
        console.warn('   3. Profile was deleted')
        return null
      }

      console.log('✅ Profile fetched successfully:', {
        id: data.id,
        full_name: data.full_name,
        role: data.role,
      })
      
      return data as Profile
    } catch (error: any) {
      // Ignore AbortError
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return null
      }
      console.error('❌ Exception fetching profile:', error)
      return null
    }
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  // Clear stale/invalid authentication data
  const clearStaleAuth = async () => {
    try {
      // Check if we have a stored session
      const storedSession = localStorage.getItem('sb-auth-token')
      if (!storedSession) return

      // Try to validate the session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // If there's an error or no valid session, clear storage
      if (error || !session) {
        console.log('🧹 Clearing stale authentication data')
        // Clear Supabase auth storage
        await supabase.auth.signOut()
        // Also clear localStorage items that might be stale
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log('✅ Cleared stale auth data')
      } else if (session) {
        // Check if token is expired
        const expiresAt = session.expires_at
        if (expiresAt) {
          const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
          // If token expires in less than 1 minute, it's effectively expired
          if (expiresIn < 60) {
            console.log('🧹 Token expired, clearing stale data')
            await supabase.auth.signOut()
            const keysToRemove: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key))
          }
        }
      }
    } catch (error: any) {
      // If clearing fails, force clear localStorage
      console.warn('⚠️ Error clearing stale auth, forcing clear:', error)
      try {
        await supabase.auth.signOut()
      } catch {
        // Ignore signOut errors
      }
      // Clear all Supabase-related localStorage items
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  // Initialize auth state - optimized for fast initial load with stale token detection
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    // First, check and clear any stale authentication data
    clearStaleAuth()
      .then(() => {
        if (!isMounted) return
        
        // Fast timeout - show login form quickly if no session
        timeoutId = setTimeout(() => {
          if (isMounted) {
            // If we still don't have a session after 2 seconds, stop loading
            // This allows the login form to show quickly
            if (!session) {
              console.log('⏱️ Fast timeout - no session found, showing login form')
              setLoading(false)
            }
          }
        }, 2000) // 2 second timeout for initial load

        // Get initial session with error handling for refresh token issues
        return supabase.auth.getSession()
      })
      .then(({ data: { session }, error }) => {
        if (!isMounted) return
        
        // Handle refresh token errors gracefully - don't block the UI
        if (error) {
          // Ignore AbortError - it's expected when component unmounts
          if (error.name === 'AbortError' || error.message?.includes('aborted')) {
            return
          }
          // If refresh token is invalid, clear storage and show login
          if (error.message?.includes('Refresh Token') || 
              error.message?.includes('refresh_token') ||
              error.message?.includes('Invalid Refresh Token') ||
              error.message?.includes('Token Not Found')) {
            console.log('ℹ️ Invalid refresh token detected, clearing stale data')
            // Clear stale auth data
            clearStaleAuth().then(() => {
              if (isMounted) {
                setLoading(false)
                if (timeoutId) clearTimeout(timeoutId)
              }
            })
            return
          }
          console.error('Error getting session:', error)
          if (isMounted) {
            setLoading(false)
            if (timeoutId) clearTimeout(timeoutId)
          }
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch profile but don't block UI if it fails
          fetchProfile(session.user.id)
            .then((profile) => {
              if (isMounted) {
                setProfile(profile)
                setLoading(false)
                if (timeoutId) clearTimeout(timeoutId)
              }
            })
            .catch((error) => {
              // Ignore AbortError - it's expected when component unmounts
              if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                return
              }
              console.error('Error fetching profile:', error)
              if (isMounted) {
                setLoading(false)
                if (timeoutId) clearTimeout(timeoutId)
              }
            })
        } else {
          // No session - show login form immediately
          if (isMounted) {
            setLoading(false)
            if (timeoutId) clearTimeout(timeoutId)
          }
        }
      })
      .catch((error) => {
        // Ignore AbortError - it's expected when component unmounts
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          return
        }
        // If refresh token errors, clear storage
        if (error.message?.includes('Refresh Token') || 
            error.message?.includes('refresh_token') ||
            error.message?.includes('Invalid Refresh Token')) {
          console.log('ℹ️ Refresh token error during init, clearing stale data')
          clearStaleAuth().then(() => {
            if (isMounted) {
              setLoading(false)
              if (timeoutId) clearTimeout(timeoutId)
            }
          })
          return
        }
        console.error('Error in getSession:', error)
        if (isMounted) {
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
        }
      })

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        // If we get a TOKEN_REFRESHED event with no session, clear stale data
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('🧹 Token refresh failed, clearing stale data')
          await clearStaleAuth()
          setLoading(false)
          return
        }
        
        // If we get an error event, clear stale data
        if (event === 'SIGNED_OUT' && !session) {
          // Clear any remaining stale data
          await clearStaleAuth()
        }
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            console.log('🔄 Fetching profile for user:', session.user.id, session.user.email)
            
            // Fetch profile with minimal retry (only 1 retry for speed)
            let profileData = await fetchProfile(session.user.id, true)
            if (!profileData) {
              // Single quick retry
              await new Promise(resolve => setTimeout(resolve, 300))
              profileData = await fetchProfile(session.user.id, true)
            }
            
            if (profileData) {
              console.log('✅ Profile loaded in auth state change:', profileData)
              setProfile(profileData)
            } else {
              console.error('❌ Profile is null after fetchProfile call (all retries exhausted)')
              console.error('   User ID:', session.user.id)
              console.error('   Email:', session.user.email)
              console.error('   💡 Check:')
              console.error('      1. Profile exists in database (run diagnostic query)')
              console.error('      2. RLS policy "Users can view their own profile" is active')
              console.error('      3. Session token is valid')
              // Don't set profile to null - keep trying
            }
          } catch (error: any) {
            // Ignore AbortError - it's expected when component unmounts
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
              return
            }
            // If it's a token error, clear stale data
            if (error.message?.includes('Refresh Token') || 
                error.message?.includes('Invalid Refresh Token') ||
                error.message?.includes('Token Not Found')) {
              console.log('🧹 Token error in auth state change, clearing stale data')
              await clearStaleAuth()
            }
            console.error('❌ Error fetching profile in auth state change:', error)
            console.error('   User ID:', session?.user?.id)
            console.error('   Email:', session?.user?.email)
            console.error('   Error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
            })
          }
        } else {
          setProfile(null)
        }

        // Always set loading to false after auth state change
        setLoading(false)

        // Handle different auth events
        if (event === 'SIGNED_IN') {
          // Don't show toast here - it's shown in Login component
          console.log('✅ SIGNED_IN event received')
        } else if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!')
        }
      } catch (error: any) {
        // Ignore AbortError - it's expected when component unmounts
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          return
        }
        // If it's a token error, clear stale data
        if (error.message?.includes('Refresh Token') || 
            error.message?.includes('Invalid Refresh Token')) {
          console.log('🧹 Token error, clearing stale data')
          clearStaleAuth()
        }
        console.error('Error in auth state change:', error)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = 'Supabase is not configured. Please check your .env file.'
        console.error('❌', errorMsg)
        console.error('Missing:', {
          url: !supabaseUrl,
          key: !supabaseAnonKey,
        })
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide more helpful error messages
        let userFriendlyError = error.message
        
        if (error.status === 400) {
          if (error.message.includes('Invalid login credentials') || error.message.includes('invalid')) {
            userFriendlyError = 'Invalid email or password. Please check your credentials and try again.'
            console.error('❌ Login failed:', {
              status: error.status,
              message: error.message,
              email: email,
            })
          } else if (error.message.includes('Email not confirmed')) {
            userFriendlyError = 'Please verify your email address before signing in.'
          } else {
            userFriendlyError = `Authentication failed: ${error.message}`
            console.error('❌ Login error (400):', {
              status: error.status,
              message: error.message,
              email: email,
            })
          }
        } else if (error.status === 401) {
          if (error.message.includes('Invalid API key') || error.message.includes('Invalid API Key')) {
            userFriendlyError = 'Supabase API key is invalid. Please check your .env file configuration.'
            console.error('❌ Invalid Supabase API Key!')
            console.error('This usually means:')
            console.error('1. Your VITE_SUPABASE_ANON_KEY in .env is incorrect')
            console.error('2. The key has been rotated/changed in Supabase')
            console.error('3. You\'re using the wrong project\'s credentials')
            console.error('\nTo fix:')
            console.error('1. Go to Supabase Dashboard → Settings → API')
            console.error('2. Copy the "anon public" key')
            console.error('3. Update VITE_SUPABASE_ANON_KEY in your .env file')
            console.error('4. Restart your dev server')
          } else if (error.message.includes('Invalid login credentials')) {
            userFriendlyError = 'Invalid email or password. Please check your credentials and try again.'
          } else if (error.message.includes('Email not confirmed')) {
            userFriendlyError = 'Please verify your email address before signing in.'
          } else {
            userFriendlyError = 'Authentication failed. Please check your credentials.'
          }
        }
        
        console.error('Sign in error:', {
          status: error.status,
          message: error.message,
          email: email,
        })
        
        throw new Error(userFriendlyError)
      }

      if (data.user) {
        // Set user and session immediately so navigation can proceed
        setUser(data.user)
        setSession(data.session)
        setLoading(false) // Set loading to false immediately so navigation can proceed
        
        // Fetch profile in background (don't block) - will be handled by onAuthStateChange too
        fetchProfile(data.user.id, true)
          .then((profileData) => {
            if (profileData) {
              setProfile(profileData)
            }
          })
          .catch(() => {
            // Ignore errors - profile will be fetched via onAuthStateChange
          })
        
        // Return success immediately - don't wait for profile
        return { success: true }
      }

      return { success: false, error: 'No user data returned' }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'manager' | 'trainer'
  ) => {
    try {
      setLoading(true)
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: window.location.origin,
        },
      })

      if (authError) {
        // Provide more helpful error messages
        let userFriendlyError = authError.message
        
        if (authError.status === 429) {
          // Rate limit exceeded
          if (authError.message.includes('rate limit') || authError.message.includes('too many')) {
            userFriendlyError = 'Too many signup attempts. Please wait a few minutes before trying again, or use a different email address.'
          } else {
            userFriendlyError = 'Too many requests. Please wait a moment and try again.'
          }
        } else if (authError.status === 400) {
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            userFriendlyError = 'An account with this email already exists. Please use a different email or sign in instead.'
          } else if (authError.message.includes('password')) {
            userFriendlyError = 'Password does not meet requirements. Please use a stronger password.'
          } else if (authError.message.includes('email')) {
            userFriendlyError = 'Invalid email address. Please check your email and try again.'
          } else {
            userFriendlyError = 'Failed to create account. Please check your information and try again.'
          }
        }
        
        console.error('Sign up error:', {
          status: authError.status,
          message: authError.message,
          email: email,
        })
        
        throw new Error(userFriendlyError)
      }

      if (!authData.user) {
        throw new Error('User creation failed. Please try again.')
      }

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          role: role,
          team_id: null,
          reporting_manager_id: null,
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        
        // Provide specific error messages
        let profileErrorMessage = 'Failed to create user profile.'
        
        if (profileError.code === '42501' || profileError.message.includes('permission denied') || profileError.message.includes('policy')) {
          profileErrorMessage = 'Permission denied. Please make sure you have the correct RLS policies set up. Run fix-rls-recursion.sql if you haven\'t already.'
        } else if (profileError.code === '23505' || profileError.message.includes('duplicate')) {
          profileErrorMessage = 'Profile already exists for this user.'
        } else if (profileError.code === '23503' || profileError.message.includes('foreign key')) {
          profileErrorMessage = 'Invalid user ID. Please try signing up again.'
        }
        
        throw new Error(profileErrorMessage)
      }

      // Fetch the newly created profile
      const profileData = await fetchProfile(authData.user.id)
      setProfile(profileData)

      toast.success('Account created successfully!')
      return { success: true }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create account'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
