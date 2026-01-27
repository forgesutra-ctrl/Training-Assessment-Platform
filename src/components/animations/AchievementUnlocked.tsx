import { motion, AnimatePresence } from 'framer-motion'
import { Award, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import Confetti from './Confetti'

interface AchievementUnlockedProps {
  show: boolean
  title: string
  description?: string
  icon?: React.ReactNode
  onComplete?: () => void
}

const AchievementUnlocked = ({
  show,
  title,
  description,
  icon,
  onComplete,
}: AchievementUnlockedProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <>
      <Confetti trigger={show} variant="achievement" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-4 right-4 z-50 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl p-6 max-w-sm border-4 border-yellow-300"
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="flex-shrink-0"
              >
                {icon || <Award className="w-12 h-12 text-white" />}
              </motion.div>
              <div className="flex-1">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-1"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Achievement Unlocked
                  </span>
                </motion.div>
                <motion.h3
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold text-white mb-1"
                >
                  {title}
                </motion.h3>
                {description && (
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-yellow-100"
                  >
                    {description}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-2xl"
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
        )}
      </AnimatePresence>
    </>
  )
}

export default AchievementUnlocked
