import { useEffect, useRef, useCallback } from 'react'
import { debounce } from 'lodash'

interface UseAutoSaveOptions {
  data: any
  key: string
  interval?: number
  onSave?: (data: any) => void
  enabled?: boolean
}

export const useAutoSave = ({
  data,
  key,
  interval = 30000, // 30 seconds
  onSave,
  enabled = true,
}: UseAutoSaveOptions) => {
  const lastSavedRef = useRef<any>(null)
  const saveIndicatorRef = useRef<HTMLDivElement | null>(null)

  const saveToLocalStorage = useCallback(
    debounce((dataToSave: any) => {
      try {
        localStorage.setItem(`draft_${key}`, JSON.stringify(dataToSave))
        localStorage.setItem(`draft_${key}_timestamp`, Date.now().toString())
        lastSavedRef.current = dataToSave

        // Show save indicator
        if (saveIndicatorRef.current) {
          saveIndicatorRef.current.textContent = 'Draft saved'
          saveIndicatorRef.current.classList.add('text-green-600')
          setTimeout(() => {
            if (saveIndicatorRef.current) {
              saveIndicatorRef.current.textContent = ''
              saveIndicatorRef.current.classList.remove('text-green-600')
            }
          }, 2000)
        }

        onSave?.(dataToSave)
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    }, interval),
    [key, interval, onSave]
  )

  useEffect(() => {
    if (!enabled || !data) return

    // Check if data has changed
    if (JSON.stringify(data) !== JSON.stringify(lastSavedRef.current)) {
      saveToLocalStorage(data)
    }
  }, [data, enabled, saveToLocalStorage])

  const recoverDraft = useCallback((): any => {
    try {
      const saved = localStorage.getItem(`draft_${key}`)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to recover draft:', error)
    }
    return null
  }, [key])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`draft_${key}`)
    localStorage.removeItem(`draft_${key}_timestamp`)
    lastSavedRef.current = null
  }, [key])

  const hasUnsavedDraft = useCallback((): boolean => {
    return localStorage.getItem(`draft_${key}`) !== null
  }, [key])

  return {
    recoverDraft,
    clearDraft,
    hasUnsavedDraft,
    saveIndicatorRef,
  }
}
