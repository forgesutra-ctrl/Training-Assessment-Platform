/**
 * Easter Eggs System
 * Subtle, professional hidden features and surprises
 */

class EasterEggManager {
  private konamiCode: string[] = []
  private konamiSequence = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ]
  private assessmentCount: number = 0
  private specialThemes: Record<string, string> = {}

  /**
   * Check for Konami code
   */
  checkKonamiCode(key: string): boolean {
    this.konamiCode.push(key)
    if (this.konamiCode.length > this.konamiSequence.length) {
      this.konamiCode.shift()
    }

    const matches = this.konamiCode.length === this.konamiSequence.length &&
      this.konamiCode.every((k, i) => k === this.konamiSequence[i])

    if (matches) {
      this.activateKonamiCode()
      this.konamiCode = []
      return true
    }

    return false
  }

  /**
   * Activate Konami code theme
   */
  private activateKonamiCode() {
    document.body.classList.add('konami-mode')
    localStorage.setItem('konamiMode', 'true')
    
    // Add rainbow animation
    const style = document.createElement('style')
    style.textContent = `
      .konami-mode {
        animation: rainbow 3s linear infinite;
      }
      @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
    `
    document.head.appendChild(style)

    // Show notification
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('easterEgg', {
          detail: { type: 'konami', message: '🎮 Konami Code Activated! Special theme enabled.' },
        })
      )
    }
  }

  /**
   * Track assessment count for milestones
   */
  trackAssessment(count: number) {
    this.assessmentCount = count

    // 100th assessment celebration
    if (count === 100) {
      this.celebrateMilestone(100, 'assessments')
    }
  }

  /**
   * Celebrate milestone
   */
  celebrateMilestone(number: number, type: string) {
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('easterEgg', {
          detail: {
            type: 'milestone',
            number,
            message: `🎉 Amazing! You've reached ${number} ${type}!`,
          },
        })
      )
    }
  }

  /**
   * Get fun loading message
   */
  getFunLoadingMessage(): string {
    const messages = [
      'Crunching the numbers...',
      'Gathering insights...',
      'Almost there...',
      'Working some magic...',
      'Loading awesome content...',
      'Just a moment...',
      'Preparing something great...',
      'Fetching the good stuff...',
      'Almost ready...',
      'Brewing coffee... ☕',
      'Counting stars... ⭐',
      'Training AI hamsters... 🐹',
      'Polishing pixels... ✨',
      'Summoning data... 🔮',
      'Calibrating awesomeness...',
    ]

    return messages[Math.floor(Math.random() * messages.length)]
  }

  /**
   * Get seasonal theme
   */
  getSeasonalTheme(): string | null {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()

    // New Year
    if (month === 1 && day <= 7) return 'new-year'
    // Valentine's
    if (month === 2 && day >= 10 && day <= 16) return 'valentines'
    // Halloween
    if (month === 10 && day >= 25 && day <= 31) return 'halloween'
    // Christmas
    if (month === 12 && day >= 20) return 'christmas'

    return null
  }

  /**
   * Check for hidden achievements
   */
  checkHiddenAchievements(userData: any): string[] {
    const achievements: string[] = []

    // Night owl (activity after 11 PM)
    const hour = new Date().getHours()
    if (hour >= 23 || hour < 5) {
      achievements.push('Night Owl')
    }

    // Early bird (activity before 6 AM)
    if (hour >= 5 && hour < 7) {
      achievements.push('Early Bird')
    }

    // Perfect score
    if (userData.averageScore === 5.0) {
      achievements.push('Perfect Score')
    }

    // Streak master
    if (userData.streak && userData.streak >= 30) {
      achievements.push('Streak Master')
    }

    return achievements
  }
}

// Singleton instance
export const easterEggManager = new EasterEggManager()
