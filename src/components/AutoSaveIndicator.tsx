import { motion, AnimatePresence } from 'framer-motion'
import { Save, CheckCircle2 } from 'lucide-react'

interface AutoSaveIndicatorProps {
  isSaving: boolean
  isSaved: boolean
  lastSaved?: Date
}

const AutoSaveIndicator = ({ isSaving, isSaved, lastSaved }: AutoSaveIndicatorProps) => {
  return (
    <AnimatePresence>
      {(isSaving || isSaved) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center gap-2 z-50"
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Save className="w-4 h-4 text-gray-500" />
              </motion.div>
              <span className="text-sm text-gray-600">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">
                Draft saved
                {lastSaved && (
                  <span className="text-xs text-gray-400 ml-1">
                    {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AutoSaveIndicator
