/**
 * Keyboard Shortcuts System
 * Power user shortcuts for faster navigation
 */

export interface Shortcut {
  key: string
  ctrl?: boolean
  cmd?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  category: 'navigation' | 'actions' | 'general'
}

class KeyboardShortcutsManager {
  private shortcuts: Map<string, Shortcut> = new Map()
  private isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  register(shortcut: Shortcut) {
    const key = this.getKeyString(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  unregister(key: string) {
    this.shortcuts.delete(key)
  }

  private getKeyString(shortcut: Shortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl || shortcut.cmd) parts.push(this.isMac ? 'cmd' : 'ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }

  handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey
    const cmd = event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    // Build key string
    const parts: string[] = []
    if (ctrl || cmd) parts.push(this.isMac ? 'cmd' : 'ctrl')
    if (shift) parts.push('shift')
    if (alt) parts.push('alt')
    parts.push(key)

    const keyString = parts.join('+')
    const shortcut = this.shortcuts.get(keyString)

    if (shortcut) {
      event.preventDefault()
      event.stopPropagation()
      shortcut.action()
      return true
    }

    return false
  }

  getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }

  getShortcutsByCategory(category: Shortcut['category']): Shortcut[] {
    return this.getAllShortcuts().filter((s) => s.category === category)
  }
}

// Global instance
export const shortcutsManager = new KeyboardShortcutsManager()

// Initialize keyboard listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    shortcutsManager.handleKeyDown(e)
  })
}

/**
 * Common shortcuts
 */
export const commonShortcuts = {
  quickSearch: (action: () => void) => ({
    key: 'k',
    ctrl: true,
    action,
    description: 'Quick search',
    category: 'navigation' as const,
  }),
  newAssessment: (action: () => void) => ({
    key: 'n',
    ctrl: true,
    action,
    description: 'New assessment',
    category: 'actions' as const,
  }),
  goToDashboard: (action: () => void) => ({
    key: 'd',
    ctrl: true,
    action,
    description: 'Go to dashboard',
    category: 'navigation' as const,
  }),
  exportView: (action: () => void) => ({
    key: 'e',
    ctrl: true,
    action,
    description: 'Export current view',
    category: 'actions' as const,
  }),
  showShortcuts: (action: () => void) => ({
    key: '/',
    ctrl: true,
    action,
    description: 'Show keyboard shortcuts',
    category: 'general' as const,
  }),
  closeModal: (action: () => void) => ({
    key: 'Escape',
    action,
    description: 'Close modal/cancel',
    category: 'general' as const,
  }),
}
