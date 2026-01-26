import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiCelebrationProps {
  trigger: boolean
  type?: 'goal' | 'level-up' | 'achievement' | 'milestone'
}

const ConfettiCelebration = ({ trigger, type = 'achievement' }: ConfettiCelebrationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!trigger) return

    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    // Special effects based on type
    if (type === 'level-up') {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 10000,
        })
      }, 500)
    }

    return () => clearInterval(interval)
  }, [trigger, type])

  return null
}

export default ConfettiCelebration
