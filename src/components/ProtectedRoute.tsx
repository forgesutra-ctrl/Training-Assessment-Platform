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

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If role-based access is required, check if user has allowed role
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
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
