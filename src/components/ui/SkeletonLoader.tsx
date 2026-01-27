import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'list' | 'text' | 'metric'
  count?: number
  className?: string
}

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }: SkeletonLoaderProps) => {
  const pulseAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                animate={pulseAnimation}
                className="w-12 h-12 bg-gray-200 rounded-lg"
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  animate={pulseAnimation}
                  className="h-4 bg-gray-200 rounded w-3/4"
                />
                <motion.div
                  animate={pulseAnimation}
                  className="h-3 bg-gray-200 rounded w-1/2"
                />
              </div>
            </div>
            <motion.div
              animate={pulseAnimation}
              className="h-20 bg-gray-200 rounded"
            />
          </div>
        )

      case 'table':
        return (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <motion.div
                animate={pulseAnimation}
                className="h-6 bg-gray-200 rounded w-1/4"
              />
            </div>
            <div className="divide-y divide-gray-200">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <motion.div
                    animate={pulseAnimation}
                    className="w-10 h-10 bg-gray-200 rounded-full"
                  />
                  <div className="flex-1 space-y-2">
                    <motion.div
                      animate={pulseAnimation}
                      className="h-4 bg-gray-200 rounded w-1/3"
                    />
                    <motion.div
                      animate={pulseAnimation}
                      className="h-3 bg-gray-200 rounded w-1/2"
                    />
                  </div>
                  <motion.div
                    animate={pulseAnimation}
                    className="h-8 bg-gray-200 rounded w-20"
                  />
                </div>
              ))}
            </div>
          </div>
        )

      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <motion.div
                  animate={pulseAnimation}
                  className="w-10 h-10 bg-gray-200 rounded-full"
                />
                <div className="flex-1 space-y-2">
                  <motion.div
                    animate={pulseAnimation}
                    className="h-4 bg-gray-200 rounded w-3/4"
                  />
                  <motion.div
                    animate={pulseAnimation}
                    className="h-3 bg-gray-200 rounded w-1/2"
                  />
                </div>
              </div>
            ))}
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <motion.div
                key={i}
                animate={pulseAnimation}
                className={`h-4 bg-gray-200 rounded ${i === count - 1 ? 'w-3/4' : 'w-full'}`}
              />
            ))}
          </div>
        )

      case 'metric':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <motion.div
              animate={pulseAnimation}
              className="h-4 bg-gray-200 rounded w-1/3 mb-4"
            />
            <motion.div
              animate={pulseAnimation}
              className="h-12 bg-gray-200 rounded w-1/2 mb-2"
            />
            <motion.div
              animate={pulseAnimation}
              className="h-3 bg-gray-200 rounded w-1/4"
            />
          </div>
        )

      default:
        return null
    }
  }

  return <div className={className}>{renderSkeleton()}</div>
}

export default SkeletonLoader
