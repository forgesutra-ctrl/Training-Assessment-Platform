import { X, Calendar, User, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { AssessmentWithDetails, ASSESSMENT_STRUCTURE } from '@/types'
import { calculateCategoryAverages, getScoreColor } from '@/utils/trainerStats'

interface AssessmentDetailsProps {
  assessment: AssessmentWithDetails
  onClose: () => void
}

const AssessmentDetails = ({ assessment, onClose }: AssessmentDetailsProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(ASSESSMENT_STRUCTURE.categories.map((c) => c.id))
  )

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

  const categoryAverages = calculateCategoryAverages(assessment)

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

            {/* Rating Sections - 21 Parameters by Category */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Ratings (21 Parameters)</h3>
              {ASSESSMENT_STRUCTURE.categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id)
                const avg = categoryAverages.find((ca) => ca.categoryId === category.id)?.average || 0
                const categoryParams = category.parameters.filter(
                  (param) => (assessment as any)[param.id] != null && (assessment as any)[param.id] > 0
                )

                return (
                  <div key={category.id} className="card border-l-4 border-l-primary-500">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-600">
                            {categoryParams.length} of {category.parameters.length} parameters assessed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {avg > 0 && (
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(avg)}`}>
                              {avg.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Category Avg</div>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4 mt-4">
                        {category.parameters.map((param) => {
                          const rating = (assessment as any)[param.id] as number | null
                          const comments = (assessment as any)[`${param.id}_comments`] as string | null

                          if (!rating || rating === 0) return null

                          return (
                            <div key={param.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{param.label}</h4>
                                  <p className="text-sm text-gray-600">{param.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-5 h-5 ${
                                          star <= rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'fill-gray-200 text-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className={`text-xl font-bold ${getScoreColor(rating)}`}>
                                    {rating}/5
                                  </span>
                                </div>
                              </div>
                              {comments && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {comments}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
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
