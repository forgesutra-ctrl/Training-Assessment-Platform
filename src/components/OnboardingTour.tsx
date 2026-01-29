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
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Create New Assessment</h3>
                <p>Use the &quot;Assess Now&quot; button or the header to start a new assessment. You'll rate trainers on 6 key parameters.</p>
              </div>
            ),
            placement: 'center',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">View Your Assessments</h3>
                <p>See all assessments you've submitted in the Recent Team Performance section. Click &quot;View&quot; to see full feedback.</p>
              </div>
            ),
            placement: 'center',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Quick Stats &amp; Refresh</h3>
                <p>Use the refresh button in the header to reload data. There is no auto-refresh—click when you want the latest.</p>
              </div>
            ),
            placement: 'center',
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
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Performance Overview</h3>
                <p>See your current month average, total assessments, and best/worst performing parameters at a glance.</p>
              </div>
            ),
            placement: 'center',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Parameter Breakdown</h3>
                <p>Track your performance across all 6 assessment parameters. Use the refresh button to load the latest data.</p>
              </div>
            ),
            placement: 'center',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Performance Trend</h3>
                <p>See how your performance has changed over time. Data refreshes only when you click the refresh button.</p>
              </div>
            ),
            placement: 'center',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Assessment History</h3>
                <p>View all your past assessments and detailed feedback from managers in the activity feed and sections below.</p>
              </div>
            ),
            placement: 'center',
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
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Navigation Tabs</h3>
                <p>Use the left sidebar to switch between Overview, Trainer Performance, User Management, and more.</p>
              </div>
            ),
            placement: 'center',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">Platform Statistics</h3>
                <p>Monitor overall platform health, total assessments, and average ratings on the overview.</p>
              </div>
            ),
            placement: 'center',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="font-semibold mb-2">User Management</h3>
                <p>Add, edit, and manage all users via User Management. Use the refresh button to reload data when needed.</p>
              </div>
            ),
            placement: 'center',
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
