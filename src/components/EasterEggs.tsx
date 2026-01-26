import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

/**
 * Konami Code Easter Egg
 */
export const useKonamiCode = (onSuccess?: () => void) => {
  const [sequence, setSequence] = useState<string[]>([])
  const konamiCode = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'KeyB',
    'KeyA',
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setSequence((prev) => {
        const newSeq = [...prev, e.code].slice(-konamiCode.length)
        if (newSeq.join(',') === konamiCode.join(',')) {
          // Konami code entered!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
          toast.success('🎉 You found the secret!', {
            icon: '🎮',
            duration: 3000,
          })
          onSuccess?.()
          return []
        }
        return newSeq
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSuccess])
}

/**
 * Search Easter Egg - typing "awesome"
 */
export const useSearchEasterEgg = (searchValue: string) => {
  useEffect(() => {
    if (searchValue.toLowerCase() === 'awesome') {
      toast.success('You are awesome! 🚀', {
        icon: '⭐',
        duration: 3000,
      })
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      })
    }
  }, [searchValue])
}

/**
 * 100th Assessment Celebration
 */
export const useMilestoneCelebration = (count: number, type: 'assessment' | 'goal' | 'badge') => {
  useEffect(() => {
    if (count === 100) {
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
        })
        toast.success(`🎉 Congratulations! You've reached 100 ${type}s!`, {
          duration: 5000,
        })
      }, 500)
    }
  }, [count, type])
}
