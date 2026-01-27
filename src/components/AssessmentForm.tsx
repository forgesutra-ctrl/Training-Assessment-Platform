import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Save, AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import StarRating from './StarRating'
import LoadingSpinner from './LoadingSpinner'
import AIFeedbackAssistant from './AIFeedbackAssistant'
import SuccessAnimation from './animations/SuccessAnimation'
import Confetti from './animations/Confetti'
import AnimatedButton from './ui/AnimatedButton'
import AnimatedCard from './ui/AnimatedCard'
import ShakeOnError from './ui/ShakeOnError'
import { soundManager } from '@/utils/sounds'
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
  trainers_readiness: number
  trainers_readiness_comments: string
  communication_skills: number
  communication_skills_comments: string
  domain_expertise: number
  domain_expertise_comments: string
  knowledge_displayed: number
  knowledge_displayed_comments: string
  people_management: number
  people_management_comments: string
  technical_skills: number
  technical_skills_comments: string
  overall_comments: string
}

interface FormErrors {
  trainer_id?: string
  assessment_date?: string
  trainers_readiness?: string
  trainers_readiness_comments?: string
  communication_skills?: string
  communication_skills_comments?: string
  domain_expertise?: string
  domain_expertise_comments?: string
  knowledge_displayed?: string
  knowledge_displayed_comments?: string
  people_management?: string
  people_management_comments?: string
  technical_skills?: string
  technical_skills_comments?: string
}

const AssessmentForm = () => {
  const { profile, user } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<AssessmentFormData>({
    trainer_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    trainers_readiness: 0,
    trainers_readiness_comments: '',
    communication_skills: 0,
    communication_skills_comments: '',
    domain_expertise: 0,
    domain_expertise_comments: '',
    knowledge_displayed: 0,
    knowledge_displayed_comments: '',
    people_management: 0,
    people_management_comments: '',
    technical_skills: 0,
    technical_skills_comments: '',
    overall_comments: '',
  })

  // Fetch eligible trainers (not direct reports)
  useEffect(() => {
    const fetchEligibleTrainers = async () => {
      if (!profile || !user) {
        setLoading(false)
        return
      }

      try {
        // Fetch trainers where reporting_manager_id != current manager's id
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            team_id,
            teams(team_name)
          `)
          .eq('role', 'trainer')
          .neq('reporting_manager_id', user.id)
          .order('full_name')

        if (error) throw error

        const formattedTrainers: Trainer[] = (data || []).map((trainer: any) => {
          const team = Array.isArray(trainer.teams) ? trainer.teams[0] : trainer.teams
          return {
            id: trainer.id,
            full_name: trainer.full_name,
            team_id: trainer.team_id,
            team_name: team?.team_name || 'No Team',
          }
        })

        setTrainers(formattedTrainers)
      } catch (error: any) {
        console.error('Error fetching trainers:', error)
        toast.error('Failed to load trainers')
      } finally {
        setLoading(false)
      }
    }

    fetchEligibleTrainers()
  }, [profile, user])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.trainer_id) {
      newErrors.trainer_id = 'Please select a trainer'
    }

    if (!formData.assessment_date) {
      newErrors.assessment_date = 'Please select an assessment date'
    }

    const ratingFields = [
      'trainers_readiness',
      'communication_skills',
      'domain_expertise',
      'knowledge_displayed',
      'people_management',
      'technical_skills',
    ] as const

    ratingFields.forEach((field) => {
      if (formData[field] === 0) {
        newErrors[field] = 'Please select a rating'
      }

      const commentField = `${field}_comments` as keyof AssessmentFormData
      const comment = formData[commentField] as string

      if (!comment || comment.trim().length < 20) {
        newErrors[commentField as keyof FormErrors] = 'Comments must be at least 20 characters'
      } else if (comment.length > 500) {
        newErrors[commentField as keyof FormErrors] = 'Comments must be less than 500 characters'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix all errors before submitting')
      return
    }

    if (!user || !profile) {
      toast.error('You must be logged in to submit an assessment')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.from('assessments').insert({
        trainer_id: formData.trainer_id,
        assessor_id: user.id,
        assessment_date: formData.assessment_date,
        trainers_readiness: formData.trainers_readiness,
        trainers_readiness_comments: formData.trainers_readiness_comments.trim(),
        communication_skills: formData.communication_skills,
        communication_skills_comments: formData.communication_skills_comments.trim(),
        domain_expertise: formData.domain_expertise,
        domain_expertise_comments: formData.domain_expertise_comments.trim(),
        knowledge_displayed: formData.knowledge_displayed,
        knowledge_displayed_comments: formData.knowledge_displayed_comments.trim(),
        people_management: formData.people_management,
        people_management_comments: formData.people_management_comments.trim(),
        technical_skills: formData.technical_skills,
        technical_skills_comments: formData.technical_skills_comments.trim(),
        overall_comments: formData.overall_comments.trim() || null,
      })

      if (error) {
        if (error.message.includes('cannot assess their direct reports')) {
          toast.error('You cannot assess your direct reports')
        } else {
          throw error
        }
        return
      }

      // Celebration!
      setConfettiTrigger(true)
      setShowSuccess(true)
      soundManager.playSuccess()
      toast.success('Assessment submitted successfully! 🎉')
      
      setTimeout(() => {
        setConfettiTrigger(false)
        setShowSuccess(false)
      }, 3000)
      
      // Clear form
      setFormData({
        trainer_id: '',
        assessment_date: new Date().toISOString().split('T')[0],
        trainers_readiness: 0,
        trainers_readiness_comments: '',
        communication_skills: 0,
        communication_skills_comments: '',
        domain_expertise: 0,
        domain_expertise_comments: '',
        knowledge_displayed: 0,
        knowledge_displayed_comments: '',
        people_management: 0,
        people_management_comments: '',
        technical_skills: 0,
        technical_skills_comments: '',
        overall_comments: '',
      })
      setErrors({})

      // Navigate back to dashboard after short delay
      setTimeout(() => {
        navigate('/manager/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('Error submitting assessment:', error)
      toast.error(error.message || 'Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRatingChange = (field: keyof AssessmentFormData, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field as keyof FormErrors]
        return newErrors
      })
    }
  }

  const handleCommentChange = (field: keyof AssessmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    const errorField = field as keyof FormErrors
    if (errors[errorField]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorField]
        return newErrors
      })
    }
  }

  const renderRatingSection = (
    title: string,
    ratingField: keyof AssessmentFormData,
    commentField: keyof AssessmentFormData,
    description?: string
  ) => {
    const rating = formData[ratingField] as number
    const comment = formData[commentField] as string
    const commentError = errors[commentField as keyof FormErrors]

    return (
      <AnimatedCard className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>

        <StarRating
          value={rating}
          onChange={(value) => handleRatingChange(ratingField, value)}
          required
          error={errors[ratingField as keyof FormErrors]}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Comments <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">
                ({comment.length}/500 characters, minimum 20)
              </span>
            </label>
            {rating > 0 && (
              <div className="flex-shrink-0">
                <AIFeedbackAssistant
                  rating={rating}
                  parameter={title}
                  onSuggestionSelect={(suggestion) => handleCommentChange(commentField, suggestion)}
                  currentValue={comment}
                />
              </div>
            )}
          </div>
          <textarea
            value={comment}
            onChange={(e) => handleCommentChange(commentField, e.target.value)}
            rows={4}
            className={`input-field resize-none ${
              commentError ? 'border-red-300 focus:ring-red-500' : ''
            }`}
            placeholder="Provide detailed feedback (minimum 20 characters)..."
            required
          />
          {commentError && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {commentError}
            </p>
          )}
          {!commentError && comment.length > 0 && comment.length < 20 && (
            <p className="mt-1 text-sm text-yellow-600">
              {20 - comment.length} more characters required
            </p>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading form..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">New Assessment</h1>
          <p className="text-gray-600 mt-2">Complete the assessment form below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trainer Selection */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Select Trainer <span className="text-red-500">*</span>
            </label>
            {trainers.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  No eligible trainers available. You can only assess trainers from other teams (not your direct reports).
                </p>
              </div>
            ) : (
              <>
                <select
                  value={formData.trainer_id}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, trainer_id: e.target.value }))
                    if (errors.trainer_id) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors.trainer_id
                        return newErrors
                      })
                    }
                  }}
                  className={`input-field ${errors.trainer_id ? 'border-red-300 focus:ring-red-500' : ''}`}
                  required
                >
                  <option value="">-- Select a trainer --</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.full_name} - {trainer.team_name}
                    </option>
                  ))}
                </select>
                {errors.trainer_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.trainer_id}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Assessment Date */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Assessment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.assessment_date}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, assessment_date: e.target.value }))
                if (errors.assessment_date) {
                  setErrors((prev) => {
                    const newErrors = { ...prev }
                    delete newErrors.assessment_date
                    return newErrors
                  })
                }
              }}
              className={`input-field ${errors.assessment_date ? 'border-red-300 focus:ring-red-500' : ''}`}
              required
            />
            {errors.assessment_date && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.assessment_date}
              </p>
            )}
          </div>

          {/* Rating Sections */}
          {renderRatingSection(
            "Trainer's Readiness",
            'trainers_readiness',
            'trainers_readiness_comments',
            'How well-prepared was the trainer for the session?'
          )}

          {renderRatingSection(
            'Communication Skills',
            'communication_skills',
            'communication_skills_comments',
            'How effective was the trainer\'s communication?'
          )}

          {renderRatingSection(
            'Domain Expertise',
            'domain_expertise',
            'domain_expertise_comments',
            'How strong was the trainer\'s subject matter knowledge?'
          )}

          {renderRatingSection(
            'Knowledge Displayed',
            'knowledge_displayed',
            'knowledge_displayed_comments',
            'How well did the trainer demonstrate their knowledge?'
          )}

          {renderRatingSection(
            'Real-time People Management',
            'people_management',
            'people_management_comments',
            'How effectively did the trainer manage participants?'
          )}

          {renderRatingSection(
            'Technical Skills (Laptop, Meeting Tools, Screen Sharing)',
            'technical_skills',
            'technical_skills_comments',
            'How proficient was the trainer with technical tools?'
          )}

          {/* Overall Comments */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Comments
              <span className="text-gray-500 font-normal ml-2">(Optional)</span>
            </label>
            <textarea
              value={formData.overall_comments}
              onChange={(e) => handleCommentChange('overall_comments', e.target.value)}
              rows={5}
              className="input-field resize-none"
              placeholder="Any additional feedback or observations..."
              maxLength={1000}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.overall_comments.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/manager/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="flex-1"
              onClick={() => soundManager.playClick()}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
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
