import { useState, useEffect } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Suggestion {
  id: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[]
  onDismiss?: (id: string) => void
}

const SmartSuggestions = ({ suggestions, onDismiss }: SmartSuggestionsProps) => {
  const [visible, setVisible] = useState<string[]>([])

  useEffect(() => {
    setVisible(suggestions.map((s) => s.id))
  }, [suggestions])

  const handleDismiss = (id: string) => {
    setVisible((prev) => prev.filter((v) => v !== id))
    onDismiss?.(id)
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {suggestions
          .filter((s) => visible.includes(s.id))
          .map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3"
            >
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">{suggestion.message}</p>
                {suggestion.action && (
                  <button
                    onClick={suggestion.action.onClick}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {suggestion.action.label} →
                  </button>
                )}
              </div>
              {suggestion.dismissible && (
                <button
                  onClick={() => handleDismiss(suggestion.id)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}

export default SmartSuggestions
