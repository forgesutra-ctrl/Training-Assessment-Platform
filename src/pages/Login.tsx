import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import AnimatedInput from '@/components/ui/AnimatedInput'
import AnimatedButton from '@/components/ui/AnimatedButton'
import ShakeOnError from '@/components/ui/ShakeOnError'
import toast from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const authContext = useAuthContext()
  const { signIn, user, profile, loading } = authContext
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already logged in (before login attempt)
  useEffect(() => {
    // If user is already logged in with profile, navigate immediately
    if (!loading && user && profile) {
      const roleRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        trainer: '/trainer/dashboard',
      }
      const redirectTo = roleRoutes[profile.role] || '/login'
      const from = (location.state as any)?.from?.pathname || redirectTo
      navigate(from, { replace: true })
    }
  }, [user, profile, loading, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)
    
    const result = await signIn(email, password)
    setIsLoading(false)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:51',message:'Login result received',data:{success:result?.success,hasError:!!result?.error,hasUser:!!user,hasProfile:!!profile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (result?.success) {
      setLoginSuccess(true)
      toast.success('Welcome back! 🎉')
      
      // Navigate immediately based on email - don't wait for profile or useEffect
      // Infer role from email
      let defaultRole = 'admin'
      if (email.toLowerCase().includes('manager')) defaultRole = 'manager'
      if (email.toLowerCase().includes('trainer')) defaultRole = 'trainer'
      
      const roleRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        trainer: '/trainer/dashboard',
      }
      const redirectTo = roleRoutes[defaultRole] || '/admin/dashboard'
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:66',message:'Before navigation',data:{redirectTo,currentPath:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      // Navigate immediately - try React Router first, then window.location as backup
      // Use both approaches to ensure navigation happens
      try {
        navigate(redirectTo, { replace: true })
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:72',message:'Navigate called',data:{redirectTo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:75',message:'Navigate failed, using window.location',data:{error:error?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        // If navigate fails, use window.location immediately
        window.location.href = redirectTo
      }
      
      // Aggressive fallback: if still on login page after 300ms, force navigation
      setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:82',message:'Navigation timeout check',data:{currentPath:window.location.pathname,redirectTo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        if (window.location.pathname === '/login' || window.location.pathname === '/') {
          window.location.href = redirectTo
        }
      }, 300)
    } else if (result?.error) {
      setError(result.error)
      setLoginSuccess(false)
    }
  }

  // Show loading only briefly - don't block login form for too long
  // If no user after 1.5 seconds, show login form anyway
  const [showLoginForm, setShowLoginForm] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoginForm(true)
    }, 1500) // Show login form after 1.5 seconds max
    
    // If we have a user or profile, show form immediately
    if (user || profile || !loading) {
      setShowLoginForm(true)
      clearTimeout(timer)
    }
    
    return () => clearTimeout(timer)
  }, [loading, user, profile])

  // Show loading only if we're still checking AND haven't hit the timeout
  if (loading && !showLoginForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Training Assessment System
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ShakeOnError hasError={!!error}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </ShakeOnError>

            <AnimatedInput
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              label="Email Address"
              icon={<Mail className="w-5 h-5" />}
              placeholder="you@example.com"
              error={error && email ? undefined : error}
              required
              disabled={isLoading}
            />

            <AnimatedInput
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              label="Password"
              icon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
              error={error && password ? undefined : error}
              required
              disabled={isLoading}
            />

            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </AnimatedButton>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Need to create an account?{' '}
              <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
