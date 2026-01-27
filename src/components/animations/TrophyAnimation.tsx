import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TrophyAnimationProps {
  show: boolean
  title?: string
  subtitle?: string
  onComplete?: () => void
}

const TrophyAnimation = ({ show, title = 'Top Performer!', subtitle, onComplete }: TrophyAnimationProps) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    if (show) {
      // Generate sparkles
      const newSparkles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }))
      setSparkles(newSparkles)

      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkles */}
            {sparkles.map((sparkle) => (
              <motion.div
                key={sparkle.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: sparkle.id * 0.1,
                }}
                className="absolute"
                style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            ))}

            {/* Trophy */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Trophy className="w-24 h-24 text-white drop-shadow-lg" />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
              {subtitle && <p className="text-yellow-100 text-lg">{subtitle}</p>}
            </motion.div>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TrophyAnimation
