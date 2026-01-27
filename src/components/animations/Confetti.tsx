import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  trigger: boolean
  variant?: 'default' | 'celebration' | 'success' | 'achievement'
  duration?: number
}

const Confetti = ({ trigger, variant = 'default', duration = 3000 }: ConfettiProps) => {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true)
      const end = Date.now() + duration

      const config: confetti.Options = {
        particleCount: variant === 'celebration' ? 100 : variant === 'achievement' ? 200 : 50,
        spread: variant === 'celebration' ? 70 : 50,
        origin: { y: 0.6 },
        colors: variant === 'success' 
          ? ['#10b981', '#34d399', '#6ee7b7']
          : variant === 'achievement'
          ? ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d']
          : ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
      }

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval)
          setIsActive(false)
          return
        }

        confetti({
          ...config,
          angle: Math.random() * 60 - 30,
        })
      }, 25)

      // Fire from both sides for celebration
      if (variant === 'celebration' || variant === 'achievement') {
        setTimeout(() => {
          confetti({
            ...config,
            angle: 60,
            origin: { x: 0, y: 0.6 },
          })
          confetti({
            ...config,
            angle: 120,
            origin: { x: 1, y: 0.6 },
          })
        }, 100)
      }

      return () => {
        clearInterval(interval)
        setIsActive(false)
      }
    }
  }, [trigger, variant, duration, isActive])

  return null
}

export default Confetti
