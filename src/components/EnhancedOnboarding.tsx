import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'

interface OnboardingStep {
  id: string
  title: string
  description: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

interface EnhancedOnboardingProps {
  steps: OnboardingStep[]
  onComplete?: () => void
  skipable?: boolean
}

const EnhancedOnboarding = ({ steps, onComplete, skipable = true }: EnhancedOnboardingProps) => {
  const { profile } = useAuthContext()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem(`onboarding_${profile?.role}_completed`)
    if (!onboardingCompleted) {
      setIsVisible(true)
    }
  }, [profile])

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsVisible(false)
    localStorage.setItem(`onboarding_${profile?.role}_completed`, 'true')
    if (onComplete) onComplete()
  }

  if (!isVisible || steps.length === 0) return null

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleSkip}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 bg-white rounded-2xl shadow-2xl p-6 max-w-sm"
            style={{
              top: step.position === 'bottom' ? '60%' : '20%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Step {currentStep + 1} of {steps.length}
                </span>
                {skipable && (
                  <button
                    onClick={handleSkip}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Skip tour
                  </button>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, index) => (
                <div
                  key={s.id}
                  className={`flex-1 h-1 rounded-full ${
                    index <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Get Started
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default EnhancedOnboarding
