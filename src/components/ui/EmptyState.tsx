import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { FileText, Inbox, Search, Users, TrendingUp, Target } from 'lucide-react'
import { slideUp, fadeIn } from '@/utils/animations'

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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.1 },
        },
      }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <motion.div
        variants={slideUp}
        className="mb-6"
      >
        {displayIcon}
      </motion.div>

      <motion.h3
        variants={fadeIn}
        className="text-xl font-semibold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        variants={fadeIn}
        className="text-gray-600 mb-6 max-w-md"
      >
        {description}
      </motion.p>

      <motion.div
        variants={fadeIn}
        className="flex flex-col sm:flex-row gap-3"
      >
        {onAction && actionLabel && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            {actionLabel}
          </motion.button>
        )}
        {showDemoData && onShowDemo && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShowDemo}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Show me with demo data
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}

export default EmptyState
