import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface FireworksProps {
  trigger: boolean
  count?: number
}

const Fireworks = ({ trigger, count = 3 }: FireworksProps) => {
  useEffect(() => {
    if (trigger) {
      const duration = 2000
      const end = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval)
          return
        }

        confetti({
          ...defaults,
          particleCount: 50,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        })
      }, 200)

      // Fire multiple bursts
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          confetti({
            ...defaults,
            particleCount: 100,
            origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.4) },
            colors: ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d', '#fef3c7'],
          })
        }, i * 300)
      }

      return () => clearInterval(interval)
    }
  }, [trigger, count])

  return null
}

export default Fireworks
