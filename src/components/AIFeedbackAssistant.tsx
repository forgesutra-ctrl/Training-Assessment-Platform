import { useState } from 'react'
import { Sparkles, Loader2, Check, X, RefreshCw, AlertCircle } from 'lucide-react'
import { generateFeedbackSuggestions, AISuggestion, isAIEnabled } from '@/utils/aiService'
import toast from 'react-hot-toast'

interface AIFeedbackAssistantProps {
  rating: number
  parameter: string
  onSuggestionSelect: (suggestion: string) => void
  currentValue?: string
}

const AIFeedbackAssistant = ({
  rating,
  parameter,
  onSuggestionSelect,
  currentValue,
}: AIFeedbackAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [selectedTone, setSelectedTone] = useState<'professional' | 'encouraging' | 'direct'>(
    'professional'
  )
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      // Always generate suggestions - will use fallback if AI is not enabled
      const generated = await generateFeedbackSuggestions(rating, parameter, selectedTone)
      setSuggestions(generated)
      setIsOpen(true)
      
      if (!isAIEnabled()) {
        // Show info toast that fallback suggestions are being used
        toast.success('Using template suggestions. Enable AI for personalized feedback.', {
          duration: 3000,
        })
      }
    } catch (err: any) {
      console.error('Error generating suggestions:', err)
      setError('Failed to generate suggestions. Please try again.')
      toast.error('Service temporarily unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (suggestion: AISuggestion) => {
    onSuggestionSelect(suggestion.text)
    setIsOpen(false)
    toast.success('Suggestion applied!')
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  return (
    <div className="relative">
      <button
        onClick={handleGenerate}
        disabled={loading || rating === 0}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={rating === 0 ? "Please select a rating first" : isAIEnabled() ? "Get AI feedback suggestions" : "Get template feedback suggestions"}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {isAIEnabled() ? 'AI Assistant' : 'Get Suggestions'}
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Suggestions Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tone Selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Tone:</label>
              <div className="flex gap-2">
                {(['professional', 'encouraging', 'direct'] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => {
                      setSelectedTone(tone)
                      handleRegenerate()
                    }}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      selectedTone === tone
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Label */}
            <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>
                {isAIEnabled() 
                  ? 'AI-generated suggestions. Review and edit as needed.'
                  : 'Template suggestions based on rating. Enable AI for personalized feedback.'}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Suggestions List */}
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <p className="text-sm text-gray-700 mb-2">{suggestion.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </span>
                      <button
                        onClick={() => handleSelect(suggestion)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Use This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                No suggestions available. Try adjusting the tone.
              </div>
            )}

            {/* Regenerate Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Regenerate Suggestions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AIFeedbackAssistant
