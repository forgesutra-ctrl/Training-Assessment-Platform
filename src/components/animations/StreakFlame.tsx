import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakFlameProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

const StreakFlame = ({ streak, size = 'md' }: StreakFlameProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  // Calculate flame intensity based on streak
  const intensity = Math.min(streak / 10, 1) // Max at 10-day streak
  const flameCount = Math.min(Math.floor(streak / 5), 5) // Up to 5 flames

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: flameCount }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          style={{
            filter: `brightness(${1 + intensity * 0.5})`,
          }}
        >
          <Flame
            className={`${sizeClasses[size]} ${
              i === flameCount - 1 ? 'text-orange-500' : 'text-yellow-500'
            }`}
            fill="currentColor"
          />
        </motion.div>
      ))}
      {flameCount === 0 && (
        <Flame className={`${sizeClasses[size]} text-gray-300`} />
      )}
    </div>
  )
}

export default StreakFlame
