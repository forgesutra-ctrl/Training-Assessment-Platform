import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ErrorStateProps {
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  showRefresh?: boolean
  showHome?: boolean
  variant?: 'error' | '404' | '403' | '500'
}

const ErrorState = ({
  title,
  message,
  actionLabel,
  onAction,
  showRefresh = true,
  showHome = true,
  variant = 'error',
}: ErrorStateProps) => {
  const navigate = useNavigate()

  const errorConfig = {
    error: {
      title: title || 'Something went wrong',
      icon: <AlertCircle className="w-20 h-20 text-red-400" />,
      color: 'red',
    },
    '404': {
      title: "Oops! Page not found",
      icon: <HelpCircle className="w-20 h-20 text-gray-400" />,
      color: 'gray',
      message: message || "The page you're looking for doesn't exist.",
    },
    '403': {
      title: 'Access Denied',
      icon: <AlertCircle className="w-20 h-20 text-orange-400" />,
      color: 'orange',
      message: message || "You don't have permission to access this page.",
    },
    '500': {
      title: 'Server Error',
      icon: <AlertCircle className="w-20 h-20 text-red-400" />,
      color: 'red',
      message: message || 'Our servers are having a moment. Please try again in a bit.',
    },
  }

  const config = errorConfig[variant]

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      <div className="mb-6">
        {config.icon}
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        {config.title}
      </h2>

      <p className="text-gray-600 mb-8 max-w-md">
        {config.message || message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {showRefresh && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        )}

        {showHome && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        )}

        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            {actionLabel}
          </button>
        )}
      </div>

      {variant === '404' && (
        <div className="mt-8 text-sm text-gray-500">
          <p>Error Code: 404</p>
          <p className="mt-2">Need help? <a href="/support" className="text-primary-600 hover:underline">Contact Support</a></p>
        </div>
      )}
    </div>
  )
}

export default ErrorState
