import { ReactNode } from 'react'
import { FileText, Inbox, Search, Users, TrendingUp, Target } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'search' | 'users' | 'assessments' | 'goals' | 'analytics'
  showDemoData?: boolean
  onShowDemo?: () => void
}

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  showDemoData = false,
  onShowDemo,
}: EmptyStateProps) => {
  const defaultIcons = {
    default: <FileText className="w-16 h-16 text-gray-300" />,
    search: <Search className="w-16 h-16 text-gray-300" />,
    users: <Users className="w-16 h-16 text-gray-300" />,
    assessments: <FileText className="w-16 h-16 text-gray-300" />,
    goals: <Target className="w-16 h-16 text-gray-300" />,
    analytics: <TrendingUp className="w-16 h-16 text-gray-300" />,
  }

  const displayIcon = icon || defaultIcons[variant]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-6">
        {displayIcon}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-gray-600 mb-6 max-w-md">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            {actionLabel}
          </button>
        )}
        {showDemoData && onShowDemo && (
          <button
            onClick={onShowDemo}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Show me with demo data
          </button>
        )}
      </div>
    </div>
  )
}

export default EmptyState
