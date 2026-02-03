import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  User,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { fetchEligibleTrainers as fetchEligibleTrainersApi } from '@/utils/assessments'
import { ASSESSMENT_STRUCTURE, ManagerAssessment, ParameterId } from '@/types'
import StarRating from './StarRating'
import LoadingSpinner from './LoadingSpinner'
import AIFeedbackAssistant from './AIFeedbackAssistant'
import AnimatedButton from './ui/AnimatedButton'
import AnimatedCard from './ui/AnimatedCard'
import ShakeOnError from './ui/ShakeOnError'
import toast from 'react-hot-toast'

interface Trainer {
  id: string
  full_name: string
  team_id: string | null
  team_name: string | null
}

interface AssessmentFormData {
  trainer_id: string
  assessment_date: string
  [key: string]: string | number | null
}

interface FormErrors {
  [key: string]: string
}

const TOTAL_PARAMETERS = 21

/** Comments are mandatory for ratings 1–3; optional for 4–5 */
const isCommentRequiredForRating = (rating: number) => rating >= 1 && rating <= 3

const AssessmentForm = () => {
  const { profile, user } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedTrainerId = (location.state as { preselectedTrainerId?: string } | null)?.preselectedTrainerId
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['trainer_readiness']))

  // Initialize form data with all 21 parameters
  const initializeFormData = (): AssessmentFormData => {
    const data: AssessmentFormData = {
      trainer_id: '',
      assessment_date: new Date().toISOString().split('T')[0],
      overall_comments: '',
    }

    // Add all 21 parameters with null values
    ASSESSMENT_STRUCTURE.categories.forEach((category) => {
      category.parameters.forEach((param) => {
        data[param.id] = null
        data[`${param.id}_comments`] = ''
      })
    })

    return data
  }

  const [formData, setFormData] = useState<AssessmentFormData>(initializeFormData)

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('assessment_draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setFormData((prev) => ({ ...parsed, ...prev }))
        toast.success('Draft restored', { duration: 2000 })
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.trainer_id) {
        localStorage.setItem('assessment_draft', JSON.stringify(formData))
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [formData])

  // Fetch eligible trainers (rule-based + admin overrides: no self, no reportees)
  useEffect(() => {
    const load = async () => {
      if (!profile || !user) {
        setLoading(false)
        return
      }
      try {
        const list = await fetchEligibleTrainersApi(user.id)
        const mapped = list.map((t: any) => ({
          id: t.id,
          full_name: t.full_name,
          team_id: t.team_id,
          team_name: t.team_name ?? null,
        }))
        setTrainers(mapped)
        // If opened from "Assess Now" with a preselected trainer, set that trainer
        if (preselectedTrainerId && mapped.some((t: Trainer) => t.id === preselectedTrainerId)) {
          setFormData((prev) => ({ ...prev, trainer_id: preselectedTrainerId }))
        }
      } catch (error: any) {
        console.error('Error fetching trainers:', error)
        toast.error('Failed to load trainers')
        setTrainers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile, user, preselectedTrainerId])

  // Calculate completion progress (comment required only for ratings 1–3)
  const getCompletionProgress = () => {
    let completed = 0
    ASSESSMENT_STRUCTURE.categories.forEach((category) => {
      category.parameters.forEach((param) => {
        const rating = formData[param.id] as number
        const comments = formData[`${param.id}_comments`] as string
        const ratingSet = rating != null && rating > 0
        const commentOk = !isCommentRequiredForRating(rating) || (comments && comments.length >= 20)
        if (ratingSet && commentOk) completed++
      })
    })
    const overall = (formData.overall_comments as string) || ''
    const overallOk = overall.length >= 20
    return { completed, total: TOTAL_PARAMETERS, overallOk }
  }

  // Check if category is complete
  const isCategoryComplete = (categoryId: string) => {
    const category = ASSESSMENT_STRUCTURE.categories.find((c) => c.id === categoryId)
    if (!category) return false

    return category.parameters.every((param) => {
      const rating = formData[param.id] as number
      const comments = formData[`${param.id}_comments`] as string
      const ratingSet = rating != null && rating > 0
      const commentOk = !isCommentRequiredForRating(rating) || (comments && comments.length >= 20)
      return ratingSet && commentOk
    })
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Handle rating change
  const handleRatingChange = (paramId: ParameterId, value: number) => {
    setFormData((prev) => ({ ...prev, [paramId]: value }))
    // Clear error for this field
    if (errors[paramId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[paramId]
        return newErrors
      })
    }
  }

  // Handle comment change
  const handleCommentChange = (paramId: ParameterId, value: string) => {
    setFormData((prev) => ({ ...prev, [`${paramId}_comments`]: value }))
    // Clear error for this field
    const errorKey = `${paramId}_comments`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.trainer_id) {
      newErrors.trainer_id = 'Please select a trainer'
    }

    if (!formData.assessment_date) {
      newErrors.assessment_date = 'Please select an assessment date'
    }

    // Validate all 21 parameters (comments mandatory only for ratings 1–3)
    ASSESSMENT_STRUCTURE.categories.forEach((category) => {
      category.parameters.forEach((param) => {
        const rating = formData[param.id] as number
        const comments = formData[`${param.id}_comments`] as string

        if (!rating || rating === 0) {
          newErrors[param.id] = `Please provide a rating for ${param.label}`
        } else if (isCommentRequiredForRating(rating)) {
          if (!comments || comments.length < 20) {
            newErrors[`${param.id}_comments`] = `Comments are required for ratings 1–3 (min 20 characters) for ${param.label}`
          } else if (comments.length > 500) {
            newErrors[`${param.id}_comments`] = `Comments must not exceed 500 characters`
          }
        } else if (comments && comments.length > 500) {
          newErrors[`${param.id}_comments`] = `Comments must not exceed 500 characters`
        }
      })
    })

    // Overall comments: always required, min 20 characters
    const overall = (formData.overall_comments as string) || ''
    if (!overall || overall.trim().length < 20) {
      newErrors.overall_comments = 'Overall comments are required (minimum 20 characters)'
    } else if (overall.length > 2000) {
      newErrors.overall_comments = 'Overall comments must not exceed 2000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please complete all required fields')
      return
    }

    if (!user || !profile) {
      toast.error('You must be logged in to submit an assessment')
      return
    }

    setSubmitting(true)

    try {
      // Build assessment object
      const assessmentData: any = {
        trainer_id: formData.trainer_id,
        assessor_id: user.id,
        assessment_date: formData.assessment_date,
        overall_comments: formData.overall_comments || null,
      }

      // Add all 21 parameters
      ASSESSMENT_STRUCTURE.categories.forEach((category) => {
        category.parameters.forEach((param) => {
          assessmentData[param.id] = formData[param.id]
          assessmentData[`${param.id}_comments`] = formData[`${param.id}_comments`]
        })
      })

      const { error } = await supabase.from('assessments').insert([assessmentData])

      if (error) throw error

      // Clear draft
      localStorage.removeItem('assessment_draft')

      toast.success('Assessment submitted successfully! 🎉')
      navigate('/manager/dashboard')
    } catch (error: any) {
      console.error('Error submitting assessment:', error)
      toast.error(error.message || 'Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading form..." />
      </div>
    )
  }

  const progress = getCompletionProgress()
  const allComplete = progress.completed === progress.total && progress.overallOk

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <AnimatedButton
            variant="ghost"
            onClick={() => navigate('/manager/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </AnimatedButton>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Assessment</h1>
              <p className="text-gray-600">Evaluate trainer performance across 21 detailed parameters</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <AnimatedCard className="mb-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {progress.completed}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {progress.completed} of {progress.total} Parameters Completed
                </h3>
                <p className="text-sm text-gray-600">
                  {allComplete ? '✅ Ready to submit!' : `${progress.total - progress.completed} remaining`}
                </p>
              </div>
            </div>
            <div className="w-48">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  className="bg-primary-600 h-3 rounded-full"
                />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trainer Selection */}
          <AnimatedCard>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Trainer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.trainer_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, trainer_id: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Choose a trainer...</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.full_name} {trainer.team_name ? `(${trainer.team_name})` : ''}
                    </option>
                  ))}
                </select>
                {errors.trainer_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.trainer_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.assessment_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assessment_date: e.target.value }))}
                  className="input-field"
                  required
                />
                {errors.assessment_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.assessment_date}</p>
                )}
              </div>
            </div>
          </AnimatedCard>

          {/* Category Sections */}
          {ASSESSMENT_STRUCTURE.categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id)
            const isComplete = isCategoryComplete(category.id)
            const categoryProgress = category.parameters.filter((param) => {
              const rating = formData[param.id] as number
              const comments = formData[`${param.id}_comments`] as string
              const ratingSet = rating != null && rating > 0
              const commentOk = !isCommentRequiredForRating(rating) || (comments && comments.length >= 20)
              return ratingSet && commentOk
            }).length

            return (
              <AnimatedCard
                key={category.id}
                className={`border-2 ${isComplete ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl ${isComplete ? 'opacity-100' : 'opacity-60'}`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        {category.name}
                        {isComplete && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {categoryProgress} of {category.parameters.length} parameters completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Category Content */}
                {isExpanded && (
                  <div className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-6 border-t border-gray-200 pt-4 mt-4">
                        {category.parameters.map((param) => {
                          const rating = (formData[param.id] as number) || 0
                          const comments = (formData[`${param.id}_comments`] as string) || ''
                          const ratingError = errors[param.id]
                          const commentError = errors[`${param.id}_comments`]

                          return (
                            <div key={param.id} className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <label className="text-base font-semibold text-gray-900">
                                      {param.label}
                                    </label>
                                    <div className="group relative">
                                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                      <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {param.description}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{param.description}</p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <StarRating
                                    value={rating}
                                    onChange={(value) => handleRatingChange(param.id as ParameterId, value)}
                                    required
                                    error={ratingError}
                                  />
                                  {ratingError && (
                                    <ShakeOnError hasError={!!ratingError}>
                                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {ratingError}
                                      </p>
                                    </ShakeOnError>
                                  )}
                                </div>

                                {rating > 0 && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Comments {isCommentRequiredForRating(rating) && <span className="text-red-500">*</span>}
                                      <span className="text-gray-500 font-normal ml-2">
                                        ({comments.length}/500 characters{isCommentRequiredForRating(rating) ? ', required for ratings 1–3 (min 20)' : ', optional for 4–5'})
                                      </span>
                                    </label>
                                    <textarea
                                      value={comments}
                                      onChange={(e) => handleCommentChange(param.id as ParameterId, e.target.value)}
                                      rows={4}
                                      className={`input-field resize-none ${
                                        commentError ? 'border-red-300 focus:ring-red-500' : ''
                                      }`}
                                      placeholder={isCommentRequiredForRating(rating) ? 'Required for ratings 1–3 (min 20 characters)...' : 'Optional feedback...'}
                                      required={isCommentRequiredForRating(rating)}
                                    />
                                    <ShakeOnError hasError={!!commentError}>
                                      {commentError && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                          <AlertCircle className="w-4 h-4" />
                                          {commentError}
                                        </p>
                                      )}
                                    </ShakeOnError>
                                    {!commentError && isCommentRequiredForRating(rating) && comments.length > 0 && comments.length < 20 && (
                                      <p className="mt-1 text-sm text-yellow-600">
                                        {20 - comments.length} more characters required (mandatory for ratings 1–3)
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </AnimatedCard>
            )
          })}

          {/* Overall Comments - always required; AI suggestions only here */}
          <AnimatedCard>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Overall Comments <span className="text-red-500">*</span>
                  <span className="text-gray-500 font-normal ml-2">
                    (required, minimum 20 characters)
                  </span>
                </label>
                <div className="flex-shrink-0">
                  <AIFeedbackAssistant
                    rating={4}
                    parameter="Overall feedback / summary of the assessment"
                    onSuggestionSelect={(suggestion) =>
                      setFormData((prev) => ({ ...prev, overall_comments: suggestion }))
                    }
                    currentValue={(formData.overall_comments as string) || ''}
                  />
                </div>
              </div>
              <textarea
                value={formData.overall_comments || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, overall_comments: e.target.value }))}
                rows={4}
                className={`input-field resize-none ${errors.overall_comments ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Overall feedback or observations (minimum 20 characters)..."
              />
              {errors.overall_comments && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.overall_comments}
                </p>
              )}
              {!errors.overall_comments && (formData.overall_comments as string)?.length > 0 && (formData.overall_comments as string).length < 20 && (
                <p className="mt-1 text-sm text-yellow-600">
                  {20 - (formData.overall_comments as string).length} more characters required
                </p>
              )}
            </div>
          </AnimatedCard>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {allComplete ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  All parameters and overall comments completed. Ready to submit!
                </span>
              ) : !progress.overallOk && progress.completed === progress.total ? (
                'Add overall comments (min 20 characters) to submit'
              ) : (
                `Complete all ${progress.total - progress.completed} remaining parameters and overall comments to submit`
              )}
            </div>
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting || !allComplete}
              className="min-w-[200px]"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Submit Assessment
                </>
              )}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssessmentForm
