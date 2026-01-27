import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { soundManager } from '@/utils/sounds'

const SoundToggle = () => {
  const [enabled, setEnabled] = useState(soundManager.isEnabled())

  useEffect(() => {
    setEnabled(soundManager.isEnabled())
  }, [])

  const handleToggle = () => {
    const newState = !enabled
    soundManager.setEnabled(newState)
    setEnabled(newState)

    // Play a sound to confirm (if enabling)
    if (newState) {
      soundManager.playNotification()
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-colors ${
        enabled
          ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      }`}
      title={enabled ? 'Sounds enabled' : 'Sounds disabled'}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </motion.button>
  )
}

export default SoundToggle
