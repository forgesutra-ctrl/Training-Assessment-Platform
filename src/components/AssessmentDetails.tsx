import { X, Calendar, User, Star } from 'lucide-react'
import { AssessmentWithDetails } from '@/types'

interface AssessmentDetailsProps {
  assessment: AssessmentWithDetails
  onClose: () => void
}

const AssessmentDetails = ({ assessment, onClose }: AssessmentDetailsProps) => {
  const ratingSections = [
    {
      label: "Trainer's Readiness",
      value: assessment.trainers_readiness,
      comments: assessment.trainers_readiness_comments,
    },
    {
      label: 'Communication Skills',
      value: assessment.communication_skills,
      comments: assessment.communication_skills_comments,
    },
    {
      label: 'Domain Expertise',
      value: assessment.domain_expertise,
      comments: assessment.domain_expertise_comments,
    },
    {
      label: 'Knowledge Displayed',
      value: assessment.knowledge_displayed,
      comments: assessment.knowledge_displayed_comments,
    },
    {
      label: 'Real-time People Management',
      value: assessment.people_management,
      comments: assessment.people_management_comments,
    },
    {
      label: 'Technical Skills',
      value: assessment.technical_skills,
      comments: assessment.technical_skills_comments,
    },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assessment Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Assessment ID: {assessment.id.slice(0, 8)}...
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Trainer</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{assessment.trainer_name}</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Assessor</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{assessment.assessor_name}</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Date</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(assessment.assessment_date)}
                </p>
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Overall Average Score</p>
                  <p className="text-4xl font-bold text-primary-700">
                    {assessment.average_score.toFixed(2)}
                    <span className="text-2xl text-gray-600">/5.00</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${
                        star <= Math.round(assessment.average_score)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Rating Sections */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Ratings</h3>
              {ratingSections.map((section, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{section.label}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600">
                        {section.value}
                      </span>
                      <span className="text-gray-500">/5</span>
                      <div className="flex items-center gap-1 ml-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= section.value
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {section.comments && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {section.comments}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Overall Comments */}
            {assessment.overall_comments && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Overall Comments</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {assessment.overall_comments}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(assessment.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{' '}
                  {new Date(assessment.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentDetails
