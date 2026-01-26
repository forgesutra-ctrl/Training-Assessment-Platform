import { X, Star, Calendar, User, Printer } from 'lucide-react'
import { TrainerAssessmentWithDetails } from '@/types'
import { getScoreColor, getScoreBgColor } from '@/utils/trainerStats'

interface AssessmentFeedbackModalProps {
  assessment: TrainerAssessmentWithDetails
  onClose: () => void
}

const AssessmentFeedbackModal = ({ assessment, onClose }: AssessmentFeedbackModalProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

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
      label: 'People Management',
      value: assessment.people_management,
      comments: assessment.people_management_comments,
    },
    {
      label: 'Technical Skills',
      value: assessment.technical_skills,
      comments: assessment.technical_skills_comments,
    },
  ]

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:overflow-visible">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 print:p-0">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-4 flex items-center justify-between z-10 print:static">
            <div>
              <h2 className="text-2xl font-bold">Assessment Feedback</h2>
              <p className="text-sm text-primary-100 mt-1">
                Detailed feedback from your assessment
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors print:hidden"
                aria-label="Print"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors print:hidden"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Assessment Date</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(assessment.assessment_date)}
                </p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Assessed By</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{assessment.assessor_name}</p>
              </div>
              <div className="card bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Overall Score</div>
                <div className="flex items-baseline gap-2">
                  <p className={`text-4xl font-bold ${getScoreColor(assessment.average_score)}`}>
                    {assessment.average_score.toFixed(2)}
                  </p>
                  <span className="text-gray-500 text-lg">/ 5.00</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
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
                      <span className={`text-2xl font-bold ${getScoreColor(section.value)}`}>
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
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {section.comments}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Overall Comments */}
            {assessment.overall_comments && (
              <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-primary-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary-600" />
                  Overall Comments
                </h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {assessment.overall_comments}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Assessment ID:</span>{' '}
                  {assessment.id.slice(0, 8)}...
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(assessment.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end print:hidden">
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentFeedbackModal
