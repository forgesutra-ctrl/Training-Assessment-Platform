import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface TeamCelebrationProps {
  trigger: boolean
  teamName?: string
}

const TeamCelebration = ({ trigger, teamName }: TeamCelebrationProps) => {
  useEffect(() => {
    if (trigger) {
      const duration = 3000
      const end = Date.now() + duration
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval)
          return
        }

        // Fire from multiple positions for team celebration
        confetti({
          particleCount: 50,
          angle: Math.random() * 60 + 60,
          spread: 55,
          origin: { x: Math.random() },
          colors,
        })

        confetti({
          particleCount: 50,
          angle: Math.random() * 60 + 120,
          spread: 55,
          origin: { x: Math.random() },
          colors,
        })
      }, 50)

      // Big burst in the center
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
          colors,
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [trigger, teamName])

  return null
}

export default TeamCelebration
