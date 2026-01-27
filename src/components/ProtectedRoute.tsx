import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'manager' | 'trainer')[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuthContext()
  const location = useLocation()

  // Show loading spinner while checking authentication (but with timeout)
  const [showLoading, setShowLoading] = useState(true)
  
  useEffect(() => {
    if (!loading) {
      setShowLoading(false)
    } else {
      // Don't wait forever - show loading for max 2 seconds
      const timer = setTimeout(() => {
        setShowLoading(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [loading])
  
  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If not authenticated (no user), redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user exists but no profile yet, allow access (profile will load on dashboard)
  // This prevents redirect loops when navigating immediately after login
  if (!profile) {
    // Allow access - profile will be fetched on the dashboard page
    // This is better than redirecting back to login which creates a loop
    return <>{children}</>
  }

  // If role-based access is required, check if user has allowed role
  // Only check if profile exists - if no profile yet, allow access (will check later)
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRoutes: Record<string, string> = {
      admin: '/admin/dashboard',
      manager: '/manager/dashboard',
      trainer: '/trainer/dashboard',
    }

    const redirectTo = roleRoutes[profile.role] || '/login'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
