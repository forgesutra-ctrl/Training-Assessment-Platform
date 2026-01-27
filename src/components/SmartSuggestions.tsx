import { useState, useEffect } from 'react'
import { Lightbulb, X } from 'lucide-react'

interface Suggestion {
  id: string
  text: string
  type: 'tip' | 'warning' | 'info'
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[]
  onDismiss?: (id: string) => void
}

const SmartSuggestions = ({ suggestions, onDismiss }: SmartSuggestionsProps) => {
  const [visible, setVisible] = useState<Set<string>>(new Set(suggestions.map((s) => s.id)))

  useEffect(() => {
    setVisible(new Set(suggestions.map((s) => s.id)))
  }, [suggestions])

  const handleDismiss = (id: string) => {
    setVisible((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (onDismiss) onDismiss(id)
  }

  const typeStyles = {
    tip: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-gray-50 border-gray-200 text-gray-800',
  }

  return (
    <div className="space-y-3">
      {suggestions
        .filter((s) => visible.has(s.id))
        .map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-4 rounded-lg border ${typeStyles[suggestion.type]} flex items-start gap-3`}
          >
            <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{suggestion.text}</p>
            </div>
            {onDismiss && (
              <button
                onClick={() => handleDismiss(suggestion.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
    </div>
  )
}

export default SmartSuggestions
