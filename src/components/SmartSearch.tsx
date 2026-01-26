import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, X, Clock, TrendingUp, Users, Target } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { isAIEnabled } from '@/utils/aiService'
import toast from 'react-hot-toast'

interface SmartSearchProps {
  onSearch: (query: string, results: any) => void
  placeholder?: string
}

const SmartSearch = ({ onSearch, placeholder = 'Ask anything...' }: SmartSearchProps) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [recentQueries, setRecentQueries] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  const aiEnabled = isAIEnabled()

  useEffect(() => {
    // Load recent queries from localStorage
    const saved = localStorage.getItem('smartSearchQueries')
    if (saved) {
      setRecentQueries(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery.length > 2) {
      generateSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])

  const generateSuggestions = async (q: string) => {
    // Simple pattern matching for suggestions
    const patterns = [
      { pattern: /improve|improving|better/, suggestion: 'Show trainers who improved' },
      { pattern: /active|activity/, suggestion: 'Show most active managers' },
      { pattern: /low|poor|weak/, suggestion: 'Find trainers with low scores' },
      { pattern: /compare|comparison/, suggestion: 'Compare performance periods' },
      { pattern: /technical|tech/, suggestion: 'Technical skills analysis' },
      { pattern: /communication/, suggestion: 'Communication skills report' },
    ]

    const matched = patterns
      .filter((p) => p.pattern.test(q.toLowerCase()))
      .map((p) => p.suggestion)
      .slice(0, 3)

    setSuggestions(matched)
  }

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    try {
      // Parse query intent
      const intent = parseQueryIntent(searchQuery)
      const results = await executeQuery(intent)

      // Save to recent queries
      const updated = [searchQuery, ...recentQueries.filter((q) => q !== searchQuery)].slice(0, 5)
      setRecentQueries(updated)
      localStorage.setItem('smartSearchQueries', JSON.stringify(updated))

      onSearch(searchQuery, results)
      setIsOpen(false)
      setQuery('')
    } catch (error: any) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try rephrasing your query.')
    }
  }

  const parseQueryIntent = (q: string): any => {
    const lower = q.toLowerCase()

    // Detect intent
    if (lower.includes('improve') || lower.includes('improving') || lower.includes('better')) {
      return { type: 'improving_trainers', query: q }
    }
    if (lower.includes('active') || lower.includes('activity')) {
      return { type: 'active_managers', query: q }
    }
    if (lower.includes('low') || lower.includes('poor') || lower.includes('weak')) {
      return { type: 'low_performers', query: q }
    }
    if (lower.includes('compare') || lower.includes('comparison')) {
      return { type: 'comparison', query: q }
    }
    if (lower.includes('technical') || lower.includes('tech')) {
      return { type: 'parameter', parameter: 'technical_skills', query: q }
    }
    if (lower.includes('communication')) {
      return { type: 'parameter', parameter: 'communication_skills', query: q }
    }

    return { type: 'general', query: q }
  }

  const executeQuery = async (intent: any): Promise<any> => {
    // This would call actual API endpoints based on intent
    // For now, return mock structure
    return {
      intent: intent.type,
      results: [],
      message: `Searching for: ${intent.query}`,
    }
  }

  const commonQueries = [
    'Show trainers who improved this quarter',
    'Which managers are most active?',
    'Find trainers with low technical skills',
    'Compare Q1 vs Q2 performance',
  ]

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            } else if (e.key === 'Escape') {
              setIsOpen(false)
            }
          }}
          placeholder={placeholder}
          className="input-field pl-10 pr-10 w-full"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {aiEnabled && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <Sparkles className="w-4 h-4 text-primary-600" title="AI-Powered Search" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Suggestions:</p>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion)
                      handleSearch(suggestion)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Queries */}
          {recentQueries.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent:
              </p>
              <div className="space-y-1">
                {recentQueries.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(q)
                      handleSearch(q)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Common Queries */}
          <div className="p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Try asking:</p>
            <div className="space-y-1">
              {commonQueries.map((q, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(q)
                    handleSearch(q)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* AI Status */}
          {aiEnabled && (
            <div className="p-3 border-t border-gray-200 bg-blue-50">
              <p className="text-xs text-blue-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-powered search enabled
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SmartSearch
