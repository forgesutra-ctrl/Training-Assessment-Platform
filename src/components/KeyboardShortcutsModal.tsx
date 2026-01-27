import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { shortcutsManager } from '@/utils/keyboardShortcuts'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shortcuts = shortcutsManager.getAllShortcuts()
  const byCategory = {
    navigation: shortcuts.filter((s) => s.category === 'navigation'),
    actions: shortcuts.filter((s) => s.category === 'actions'),
    general: shortcuts.filter((s) => s.category === 'general'),
  }

  const formatKey = (shortcut: any) => {
    const parts: string[] = []
    if (shortcut.ctrl || shortcut.cmd) parts.push('Ctrl')
    if (shortcut.shift) parts.push('Shift')
    if (shortcut.alt) parts.push('Alt')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Keyboard className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-6">
            {byCategory.navigation.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Navigation</h3>
                <div className="space-y-2">
                  {byCategory.navigation.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-gray-700">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {byCategory.actions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Actions</h3>
                <div className="space-y-2">
                  {byCategory.actions.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-gray-700">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {byCategory.general.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">General</h3>
                <div className="space-y-2">
                  {byCategory.general.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-gray-700">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shortcuts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No keyboard shortcuts registered yet.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd> to
              close
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default KeyboardShortcutsModal
