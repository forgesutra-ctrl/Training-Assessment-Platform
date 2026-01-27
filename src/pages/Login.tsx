import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import AnimatedInput from '@/components/ui/AnimatedInput'
import AnimatedButton from '@/components/ui/AnimatedButton'
import ShakeOnError from '@/components/ui/ShakeOnError'
import { soundManager } from '@/utils/sounds'
import toast from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const { signIn, user, profile, loading } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already logged in or after successful login
  useEffect(() => {
    if (!loading && user && profile) {
      const roleRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        trainer: '/trainer/dashboard',
      }
      const redirectTo = roleRoutes[profile.role] || '/login'
      const from = (location.state as any)?.from?.pathname || redirectTo
      navigate(from, { replace: true })
    } else if (loginSuccess && !loading && user && !profile) {
      // Login succeeded but profile not loaded after 3 seconds
      setTimeout(() => {
        if (!profile) {
          setError('Profile not found. Please contact support or check if your account is properly set up.')
          setLoginSuccess(false)
        }
      }, 3000)
    }
  }, [user, profile, loading, navigate, location, loginSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)
    soundManager.playClick()
    const result = await signIn(email, password)
    setIsLoading(false)

    if (result?.success) {
      setLoginSuccess(true)
      soundManager.playSuccess()
      toast.success('Welcome back! 🎉')
      // Navigation will happen automatically via useEffect when profile loads
    } else if (result?.error) {
      setError(result.error)
      soundManager.playError()
      setLoginSuccess(false)
    }
  }

  // Show loading while checking auth (with timeout fallback)
  if (loading) {
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </motion.div>
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
