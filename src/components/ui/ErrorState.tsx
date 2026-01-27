import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import { shake, fadeIn } from '@/utils/animations'
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
      message: message || "The page you're looking for doesn't exist. Maybe it went on vacation? 🏖️",
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.1 },
        },
      }}
      className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center"
    >
      <motion.div
        variants={shake}
        className="mb-6"
      >
        {config.icon}
      </motion.div>

      <motion.h2
        variants={fadeIn}
        className="text-3xl font-bold text-gray-900 mb-3"
      >
        {config.title}
      </motion.h2>

      <motion.p
        variants={fadeIn}
        className="text-gray-600 mb-8 max-w-md"
      >
        {config.message || message}
      </motion.p>

      <motion.div
        variants={fadeIn}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        {showRefresh && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </motion.button>
        )}

        {showHome && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </motion.button>
        )}

        {onAction && actionLabel && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {actionLabel}
          </motion.button>
        )}
      </motion.div>

      {variant === '404' && (
        <motion.div
          variants={fadeIn}
          className="mt-8 text-sm text-gray-500"
        >
          <p>Error Code: 404</p>
          <p className="mt-2">Need help? <a href="/support" className="text-primary-600 hover:underline">Contact Support</a></p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ErrorState
