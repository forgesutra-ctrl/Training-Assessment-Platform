import { useState, useEffect } from 'react'
import { Plus, Search, Keyboard, X, Command } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'

interface Shortcut {
  key: string
  label: string
  action: () => void
  category: string
}

const QuickActions = () => {
  const { profile } = useAuthContext()
  const navigate = useNavigate()
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const shortcuts: Shortcut[] = [
    {
      key: 'k',
      label: 'Open Command Palette',
      action: () => setShowCommandPalette(true),
      category: 'Navigation',
    },
    {
      key: 'n',
      label: 'New Assessment',
      action: () => navigate('/manager/assessment/new'),
      category: 'Actions',
    },
    {
      key: 'd',
      label: 'Go to Dashboard',
      action: () => {
        if (profile?.role === 'admin') navigate('/admin/dashboard')
        else if (profile?.role === 'manager') navigate('/manager/dashboard')
        else navigate('/trainer/dashboard')
      },
      category: 'Navigation',
    },
    {
      key: '?',
      label: 'Show Shortcuts',
      action: () => setShowCommandPalette(true),
      category: 'Help',
    },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }

      // Escape to close
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false)
      }

      // Handle shortcuts when palette is closed
      if (!showCommandPalette) {
        const shortcut = shortcuts.find((s) => s.key === e.key && !e.metaKey && !e.ctrlKey)
        if (shortcut) {
          e.preventDefault()
          shortcut.action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCommandPalette, shortcuts])

  const filteredShortcuts = shortcuts.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  return (
    <>
      {/* Floating Action Button */}
      {profile?.role === 'manager' && (
        <button
          onClick={() => navigate('/manager/assessment/new')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center z-40"
          title="New Assessment (N)"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Command Palette */}
      {showCommandPalette && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowCommandPalette(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 outline-none text-gray-900"
                autoFocus
              />
              <button
                onClick={() => setShowCommandPalette(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {Object.entries(groupedShortcuts).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {items.map((shortcut) => (
                      <button
                        key={shortcut.key}
                        onClick={() => {
                          shortcut.action()
                          setShowCommandPalette(false)
                          setSearchQuery('')
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <span className="text-sm text-gray-900">{shortcut.label}</span>
                        <kbd className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                          {shortcut.key}
                        </kbd>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredShortcuts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No commands found</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Keyboard className="w-3 h-3" />
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <X className="w-3 h-3" />
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default QuickActions
