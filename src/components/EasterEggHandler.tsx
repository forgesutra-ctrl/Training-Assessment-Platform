import { useEffect } from 'react'
import { easterEggManager } from '@/utils/easterEggs'
import { soundManager } from '@/utils/sounds'
import Confetti from './animations/Confetti'
import toast from 'react-hot-toast'
import { useState } from 'react'

const EasterEggHandler = () => {
  const [confettiTrigger, setConfettiTrigger] = useState(false)

  useEffect(() => {
    // Listen for easter egg events
    const handleEasterEgg = (event: CustomEvent) => {
      const { type, message, number } = event.detail

      if (type === 'konami') {
        toast.success(message, { duration: 5000 })
        soundManager.playAchievement()
      } else if (type === 'milestone') {
        toast.success(message, { duration: 5000 })
        setConfettiTrigger(true)
        setTimeout(() => setConfettiTrigger(false), 100)
        soundManager.playLevelUp()
      }
    }

    window.addEventListener('easterEgg' as any, handleEasterEgg as EventListener)

    // Listen for Konami code
    const handleKeyDown = (e: KeyboardEvent) => {
      easterEggManager.checkKonamiCode(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('easterEgg' as any, handleEasterEgg as EventListener)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return <Confetti trigger={confettiTrigger} variant="achievement" />
}

export default EasterEggHandler
