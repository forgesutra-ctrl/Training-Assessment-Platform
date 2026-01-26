import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, TrendingDown, Target, Lightbulb, AlertCircle } from 'lucide-react'
import { generatePerformanceInsights, PerformanceInsight, isAIEnabled } from '@/utils/aiService'
import { TrainerAssessmentWithDetails } from '@/types'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

interface PerformanceInsightsProps {
  trainerId: string
  assessments: TrainerAssessmentWithDetails[]
}

const PerformanceInsights = ({ trainerId, assessments }: PerformanceInsightsProps) => {
  const [insights, setInsights] = useState<PerformanceInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [aiEnabled, setAIEnabled] = useState(false)

  useEffect(() => {
    const loadInsights = async () => {
      setAIEnabled(isAIEnabled())
      setLoading(true)

      try {
        const generated = await generatePerformanceInsights(trainerId, assessments)
        setInsights(generated)
      } catch (error: any) {
        console.error('Error loading insights:', error)
        toast.error('Failed to load performance insights')
      } finally {
        setLoading(false)
      }
    }

    if (assessments.length > 0) {
      loadInsights()
    } else {
      setLoading(false)
    }
  }, [trainerId, assessments])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'improvement':
        return <Target className="w-5 h-5 text-yellow-600" />
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-600" />
      case 'prediction':
        return <Lightbulb className="w-5 h-5 text-purple-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-green-50 border-green-200'
      case 'improvement':
        return 'bg-yellow-50 border-yellow-200'
      case 'trend':
        return 'bg-blue-50 border-blue-200'
      case 'prediction':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (assessments.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Performance Insights</h3>
        </div>
        <p className="text-sm text-gray-500">No assessments yet. Insights will appear after you receive your first assessment.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Performance Insights</h3>
        </div>
        {aiEnabled && (
          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
            AI-Powered
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Analyzing your performance..." />
        </div>
      ) : insights.length === 0 ? (
        <p className="text-sm text-gray-500">No insights available at this time.</p>
      ) : (
        <>
          {!aiEnabled && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">AI features disabled</p>
                <p className="text-xs mt-1">Showing basic insights. Enable AI in admin settings for advanced analytics.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 border-2 rounded-lg ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                    {insight.data && (
                      <div className="mt-2 text-xs text-gray-600">
                        {insight.data.parameter && (
                          <span>Parameter: {insight.data.parameter.replace(/_/g, ' ')}</span>
                        )}
                        {insight.data.score && (
                          <span> • Score: {insight.data.score.toFixed(2)}/5.0</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {aiEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>Insights are AI-generated and should be used as guidance, not definitive assessments.</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PerformanceInsights
