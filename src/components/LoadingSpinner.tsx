import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  personality?: boolean
}

const LoadingSpinner = ({ size = 'md', className = '', text, personality = true }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const messages = personality
    ? [
        'Crunching the numbers...',
        'Gathering insights...',
        'Almost there...',
        'Working some magic...',
        'Loading awesome content...',
        'Just a moment...',
        'Preparing something great...',
        'Fetching the good stuff...',
        'Almost ready...',
      ]
    : ['Loading...']

  const [message, setMessage] = useState(text || messages[0])

  useEffect(() => {
    if (personality && !text) {
      const interval = setInterval(() => {
        setMessage(messages[Math.floor(Math.random() * messages.length)])
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [personality, text])

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary-600`} />
      </motion.div>
      {(text || personality) && (
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-600 font-medium"
          >
            {message}
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  )
}

export default LoadingSpinner
