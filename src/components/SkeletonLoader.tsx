import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'chart' | 'avatar'
  count?: number
  className?: string
}

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }: SkeletonLoaderProps) => {
  const shimmer = (
    <motion.div
      className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent"
      animate={{
        x: ['0%', '100%'],
      }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      }}
    />
  )

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded relative overflow-hidden">
                {shimmer}
              </div>
            ))}
          </div>
        )

      case 'card':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-6 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4 relative overflow-hidden">{shimmer}</div>
                  <div className="h-4 bg-gray-200 rounded w-full relative overflow-hidden">{shimmer}</div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 relative overflow-hidden">{shimmer}</div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'table':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded flex-1 relative overflow-hidden">{shimmer}</div>
                <div className="h-10 bg-gray-200 rounded w-32 relative overflow-hidden">{shimmer}</div>
                <div className="h-10 bg-gray-200 rounded w-24 relative overflow-hidden">{shimmer}</div>
              </div>
            ))}
          </div>
        )

      case 'chart':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-64 bg-gray-100 rounded relative overflow-hidden">{shimmer}</div>
          </div>
        )

      case 'avatar':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full relative overflow-hidden">{shimmer}</div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 relative overflow-hidden">{shimmer}</div>
              <div className="h-3 bg-gray-200 rounded w-1/2 relative overflow-hidden">{shimmer}</div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return <div className={className}>{renderSkeleton()}</div>
}

export default SkeletonLoader
