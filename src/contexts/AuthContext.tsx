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
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data as Profile
    } catch (error) {
      console.error('Error fetching profile:', error)
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

  // Initialize auth state
  useEffect(() => {
    let isMounted = true
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ Auth initialization timeout - setting loading to false')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return
        
        if (error) {
          // Ignore AbortError - it's expected when component unmounts
          if (error.name === 'AbortError' || error.message?.includes('aborted')) {
            return
          }
          console.error('Error getting session:', error)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchProfile(session.user.id)
            .then((profile) => {
              if (isMounted) {
                setProfile(profile)
                setLoading(false)
                clearTimeout(timeoutId)
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
                clearTimeout(timeoutId)
              }
            })
        } else {
          setLoading(false)
          clearTimeout(timeoutId)
        }
      })
      .catch((error) => {
        // Ignore AbortError - it's expected when component unmounts
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          return
        }
        console.error('Error in getSession:', error)
        if (isMounted) {
          setLoading(false)
          clearTimeout(timeoutId)
        }
      })

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          } catch (error: any) {
            // Ignore AbortError - it's expected when component unmounts
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
              return
            }
            console.error('Error fetching profile in auth state change:', error)
          }
        } else {
          setProfile(null)
        }

        setLoading(false)

        // Handle different auth events
        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in!')
        } else if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!')
        }
      } catch (error: any) {
        // Ignore AbortError - it's expected when component unmounts
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          return
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
        
        if (error.status === 401) {
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
        // Fetch profile after successful login
        const profileData = await fetchProfile(data.user.id)
        setProfile(profileData)
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
