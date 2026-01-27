import { Save, CheckCircle2 } from 'lucide-react'

interface AutoSaveIndicatorProps {
  isSaving: boolean
  isSaved: boolean
  lastSaved?: Date | null
}

const AutoSaveIndicator = ({ isSaving, isSaved, lastSaved }: AutoSaveIndicatorProps) => {
  if (!isSaving && !isSaved) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center gap-2 z-50">
      {isSaving ? (
        <>
          <Save className="w-4 h-4 text-gray-500 animate-spin" />
          <span className="text-sm text-gray-600">Saving...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">Saved</span>
            {lastSaved && (
              <span className="text-xs text-gray-400">
                {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AutoSaveIndicator
