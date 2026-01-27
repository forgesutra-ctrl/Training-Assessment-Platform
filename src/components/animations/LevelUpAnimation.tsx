import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Star } from 'lucide-react'
import { useEffect } from 'react'
import Confetti from './Confetti'

interface LevelUpAnimationProps {
  show: boolean
  level: number
  onComplete?: () => void
}

const LevelUpAnimation = ({ show, level, onComplete }: LevelUpAnimationProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <>
      <Confetti trigger={show} variant="achievement" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onComplete}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Level Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="relative"
              >
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <TrendingUp className="w-16 h-16 text-purple-600" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                >
                  <span className="text-2xl font-bold text-gray-900">{level}</span>
                </motion.div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h3 className="text-4xl font-bold text-white mb-2">Level Up!</h3>
                <p className="text-white text-xl">You've reached Level {level}</p>
              </motion.div>

              {/* Stars */}
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: [0, 1.5, 1], rotate: 360 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                  className="absolute"
                  style={{
                    top: `${20 + i * 15}%`,
                    left: `${10 + i * 20}%`,
                  }}
                >
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default LevelUpAnimation
