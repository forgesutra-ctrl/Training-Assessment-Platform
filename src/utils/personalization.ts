/**
 * Personalization Utilities
 * Store and retrieve user preferences
 */

export interface UserPreferences {
  dateRange?: string
  dashboardLayout?: 'grid' | 'list'
  tableColumns?: Record<string, boolean>
  chartType?: string
  theme?: 'light' | 'dark'
  fontSize?: 'small' | 'medium' | 'large'
  reduceMotion?: boolean
  highContrast?: boolean
}

const PREFERENCES_KEY = 'user_preferences'

export const savePreferences = (userId: string, preferences: Partial<UserPreferences>) => {
  try {
    const existing = getPreferences(userId)
    const updated = { ...existing, ...preferences }
    localStorage.setItem(`${PREFERENCES_KEY}_${userId}`, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save preferences:', error)
  }
}

export const getPreferences = (userId: string): UserPreferences => {
  try {
    const saved = localStorage.getItem(`${PREFERENCES_KEY}_${userId}`)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
  }
  return {}
}

export const getGreeting = (name: string): string => {
  const hour = new Date().getHours()
  let timeOfDay = ''

  if (hour < 12) {
    timeOfDay = 'Good morning'
  } else if (hour < 17) {
    timeOfDay = 'Good afternoon'
  } else {
    timeOfDay = 'Good evening'
  }

  return `${timeOfDay}, ${name}!`
}

export const checkBirthday = (birthdate?: string): boolean => {
  if (!birthdate) return false
  const today = new Date()
  const birth = new Date(birthdate)
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate()
}

export const checkWorkAnniversary = (startDate?: string): { isAnniversary: boolean; years: number } => {
  if (!startDate) return { isAnniversary: false, years: 0 }
  const today = new Date()
  const start = new Date(startDate)
  const years = today.getFullYear() - start.getFullYear()
  const isAnniversary =
    today.getMonth() === start.getMonth() && today.getDate() === start.getDate()
  return { isAnniversary, years }
}
