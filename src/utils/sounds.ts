/**
 * Sound Effects System
 * Optional, toggle-able sound effects for user interactions
 */

class SoundManager {
  private enabled: boolean = false
  private volume: number = 0.3
  private audioContext: AudioContext | null = null

  constructor() {
    // Check localStorage for sound preference
    const saved = localStorage.getItem('soundsEnabled')
    this.enabled = saved === 'true'

    // Initialize audio context (required for Web Audio API)
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext()
    }
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    localStorage.setItem('soundsEnabled', String(enabled))
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Play a beep sound
   */
  playBeep(frequency: number = 800, duration: number = 100) {
    if (!this.enabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration / 1000)
  }

  /**
   * Play success sound
   */
  playSuccess() {
    if (!this.enabled || !this.audioContext) return

    // Play a pleasant ascending chord
    const frequencies = [523.25, 659.25, 783.99] // C, E, G
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 200)
      }, index * 50)
    })
  }

  /**
   * Play error sound
   */
  playError() {
    if (!this.enabled || !this.audioContext) return

    // Play a descending tone
    const frequencies = [400, 300, 200]
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 150)
      }, index * 80)
    })
  }

  /**
   * Play notification sound
   */
  playNotification() {
    if (!this.enabled || !this.audioContext) return
    this.playBeep(600, 150)
  }

  /**
   * Play level up sound
   */
  playLevelUp() {
    if (!this.enabled || !this.audioContext) return

    // Play a triumphant fanfare
    const notes = [523.25, 659.25, 783.99, 1046.5] // C, E, G, C
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 300)
      }, index * 100)
    })
  }

  /**
   * Play button click sound
   */
  playClick() {
    if (!this.enabled || !this.audioContext) return
    this.playBeep(400, 50)
  }

  /**
   * Play achievement sound
   */
  playAchievement() {
    if (!this.enabled || !this.audioContext) return

    // Play a celebratory sequence
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playBeep(freq, 200)
      }, index * 80)
    })
  }
}

// Singleton instance
export const soundManager = new SoundManager()
