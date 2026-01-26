import { useState, useEffect } from 'react'
import { Settings, Eye, Type, Volume2 } from 'lucide-react'
import { savePreferences, getPreferences } from '@/utils/personalization'
import { useAuthContext } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const AccessibilitySettings = () => {
  const { user } = useAuthContext()
  const [preferences, setPreferences] = useState({
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    reduceMotion: false,
    highContrast: false,
  })

  useEffect(() => {
    if (user) {
      const saved = getPreferences(user.id)
      setPreferences({
        fontSize: saved.fontSize || 'medium',
        reduceMotion: saved.reduceMotion || false,
        highContrast: saved.highContrast || false,
      })
    }
  }, [user])

  useEffect(() => {
    // Apply preferences to document
    document.documentElement.classList.toggle('reduce-motion', preferences.reduceMotion)
    document.documentElement.classList.toggle('high-contrast', preferences.highContrast)
    document.documentElement.setAttribute('data-font-size', preferences.fontSize)
  }, [preferences])

  const handleChange = (key: string, value: any) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    if (user) {
      savePreferences(user.id, updated)
      toast.success('Preferences saved')
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Accessibility Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Font Size */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Type className="w-4 h-4" />
            Font Size
          </label>
          <div className="flex gap-3">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => handleChange('fontSize', size)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  preferences.fontSize === size
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reduce Motion */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Eye className="w-4 h-4" />
            Reduce Motion
          </label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(e) => handleChange('reduceMotion', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              Minimize animations and transitions for users sensitive to motion
            </span>
          </div>
        </div>

        {/* High Contrast */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Eye className="w-4 h-4" />
            High Contrast Mode
          </label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) => handleChange('highContrast', e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              Increase contrast for better visibility
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccessibilitySettings
