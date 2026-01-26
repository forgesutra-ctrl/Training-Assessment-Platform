import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { useAuthContext } from '@/contexts/AuthContext'
import { X } from 'lucide-react'

interface OnboardingTourProps {
  onComplete?: () => void
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const { profile } = useAuthContext()
  const [runTour, setRunTour] = useState(false)
  const [tourCompleted, setTourCompleted] = useState(false)

  useEffect(() => {
    // Check if user has completed tour
    const hasCompletedTour = localStorage.getItem(`tour_completed_${profile?.role}`)
    if (!hasCompletedTour && profile) {
      // Small delay to ensure page is loaded
      setTimeout(() => setRunTour(true), 500)
    }
  }, [profile])

  const getTourSteps = (): Step[] => {
    if (!profile) return []

    switch (profile.role) {
      case 'manager':
        return [
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold text-lg mb-2">Welcome to Your Manager Dashboard! 👋</h3>
                <p>Let's take a quick tour to help you get started with assessing trainers.</p>
              </div>
            ),
            placement: 'center',
            disableBeacon: true,
          },
          {
            target: '[data-tour="new-assessment-button"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Create New Assessment</h3>
                <p>Click here to assess a trainer from another team. You'll rate them on 6 key parameters.</p>
              </div>
            ),
            placement: 'bottom',
          },
          {
            target: '[data-tour="recent-assessments"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">View Your Assessments</h3>
                <p>See all assessments you've submitted. Click "View Details" to see full feedback.</p>
              </div>
            ),
            placement: 'top',
          },
          {
            target: '[data-tour="stats-cards"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Quick Stats</h3>
                <p>Track your assessment activity and see how many trainers you've assessed this month.</p>
              </div>
            ),
            placement: 'bottom',
          },
        ]

      case 'trainer':
        return [
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold text-lg mb-2">Welcome to Your Performance Dashboard! 🎯</h3>
                <p>Here's where you'll see all your assessment feedback and track your growth.</p>
              </div>
            ),
            placement: 'center',
            disableBeacon: true,
          },
          {
            target: '[data-tour="performance-overview"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Performance Overview</h3>
                <p>See your current month average, total assessments, and best/worst performing parameters.</p>
              </div>
            ),
            placement: 'bottom',
          },
          {
            target: '[data-tour="parameter-breakdown"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Parameter Breakdown</h3>
                <p>Track your performance across all 6 assessment parameters with visual progress bars.</p>
              </div>
            ),
            placement: 'top',
          },
          {
            target: '[data-tour="performance-trend"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Performance Trend</h3>
                <p>See how your performance has changed over time with this interactive chart.</p>
              </div>
            ),
            placement: 'top',
          },
          {
            target: '[data-tour="assessment-history"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Assessment History</h3>
                <p>View all your past assessments and detailed feedback from managers.</p>
              </div>
            ),
            placement: 'top',
          },
        ]

      case 'admin':
        return [
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold text-lg mb-2">Welcome to the Admin Dashboard! 🚀</h3>
                <p>You have full access to manage users, view analytics, and configure the platform.</p>
              </div>
            ),
            placement: 'center',
            disableBeacon: true,
          },
          {
            target: '[data-tour="admin-tabs"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Navigation Tabs</h3>
                <p>Switch between different sections: Overview, Trainer Performance, User Management, and more.</p>
              </div>
            ),
            placement: 'bottom',
          },
          {
            target: '[data-tour="platform-stats"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Platform Statistics</h3>
                <p>Monitor overall platform health, total assessments, and average ratings.</p>
              </div>
            ),
            placement: 'bottom',
          },
          {
            target: '[data-tour="user-management"]',
            content: (
              <div>
                <h3 className="font-semibold mb-2">User Management</h3>
                <p>Add, edit, and manage all users. Bulk upload via CSV or add individually.</p>
              </div>
            ),
            placement: 'top',
          },
        ]

      default:
        return []
    }
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false)
      setTourCompleted(true)
      if (profile) {
        localStorage.setItem(`tour_completed_${profile.role}`, 'true')
      }
      onComplete?.()
    }
  }

  if (!profile || tourCompleted) return null

  return (
    <Joyride
      steps={getTourSteps()}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1',
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  )
}

export default OnboardingTour
