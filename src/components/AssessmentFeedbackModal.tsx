import { useState } from 'react'
import { X, Star, Calendar, User, Printer, ChevronDown, ChevronUp } from 'lucide-react'
import { TrainerAssessmentWithDetails, ASSESSMENT_STRUCTURE } from '@/types'
import { getScoreColor, getScoreBgColor, calculateCategoryAverages } from '@/utils/trainerStats'
import { motion, AnimatePresence } from 'framer-motion'

interface AssessmentFeedbackModalProps {
  assessment: TrainerAssessmentWithDetails
  onClose: () => void
}

const AssessmentFeedbackModal = ({ assessment, onClose }: AssessmentFeedbackModalProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(ASSESSMENT_STRUCTURE.categories.map((c) => c.id))
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

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
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none">
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
                <p className="text-lg font-semibold text-gray-900">
                  {assessment.assessor_name}
                </p>
              </div>

              <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Star className="w-5 h-5" />
                  <span className="text-sm font-medium">Overall Average</span>
                </div>
                <p className={`text-3xl font-bold ${getScoreColor(assessment.average_score)}`}>
                  {assessment.average_score.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">/ 5.00</p>
              </div>
            </div>

            {/* Category Averages */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Averages</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {categoryAverages.map((catAvg) => {
                  const category = ASSESSMENT_STRUCTURE.categories.find((c) => c.id === catAvg.categoryId)
                  return (
                    <div key={catAvg.categoryId} className="text-center">
                      <div className="text-2xl mb-2">{category?.icon}</div>
                      <p className="text-xs font-medium text-gray-600 mb-1">{catAvg.categoryName}</p>
                      <p className={`text-xl font-bold ${getScoreColor(catAvg.average)}`}>
                        {catAvg.average.toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Category Sections */}
            {ASSESSMENT_STRUCTURE.categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id)
              const categoryAvg = categoryAverages.find((ca) => ca.categoryId === category.id)

              return (
                <div key={category.id} className="card border-2 border-gray-200">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{category.icon}</div>
                      <div className="text-left">
                        <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">
                          Average: <span className={`font-bold ${getScoreColor(categoryAvg?.average || 0)}`}>
                            {categoryAvg?.average.toFixed(2) || '0.00'}
                          </span>
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
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
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
                                    <span className={`text-lg font-bold min-w-[3rem] text-right ${getScoreColor(rating)}`}>
                                      {rating} / 5
                                    </span>
                                  </div>
                                </div>
                                {comments && (
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comments}</p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            {/* Overall Comments */}
            {assessment.overall_comments && (
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Comments</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {assessment.overall_comments}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentFeedbackModal
