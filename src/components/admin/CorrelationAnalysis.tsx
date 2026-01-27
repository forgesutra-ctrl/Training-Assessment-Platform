import { useState, useEffect } from 'react'
import { TrendingUp, BarChart3, AlertCircle } from 'lucide-react'
import { buildCorrelationMatrix, getCorrelationInsights, analyzeFrequencyVsPerformance } from '@/utils/correlationAnalysis'
import { supabase } from '@/lib/supabase'
import { AssessmentWithDetails } from '@/types'
import { calculateAssessmentAverage } from '@/utils/trainerStats'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const CorrelationAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [correlationMatrix, setCorrelationMatrix] = useState<any>(null)
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    loadCorrelationData()
  }, [])

  const [error, setError] = useState<string | null>(null)

  const loadCorrelationData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch assessments
      const { data: assessments, error: fetchError } = await supabase
        .from('assessments')
        .select('*')
        .order('assessment_date', { ascending: false })
        .limit(500)

      if (fetchError) throw fetchError

      if (!assessments || assessments.length === 0) {
        setError('No assessment data available for correlation analysis')
        toast.error('No assessment data available for correlation analysis')
        return
      }

      // Format assessments (calculate average from all 21 parameters)
      const formattedAssessments: AssessmentWithDetails[] = assessments.map((a: any) => ({
        ...a,
        average_score: calculateAssessmentAverage(a),
      }))

      // Build correlation matrix
      const matrix = buildCorrelationMatrix(formattedAssessments)
      const correlationInsights = getCorrelationInsights(matrix)

      setCorrelationMatrix(matrix)
      setInsights(correlationInsights)
    } catch (error: any) {
      console.error('Error loading correlation data:', error)
      const errorMessage = error?.message || 'Failed to load correlation analysis'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getCorrelationColor = (value: number) => {
    const abs = Math.abs(value)
    if (abs >= 0.7) return 'bg-blue-600'
    if (abs >= 0.5) return 'bg-blue-400'
    if (abs >= 0.3) return 'bg-blue-200'
    return 'bg-gray-100'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Analyzing correlations..." />
      </div>
    )
  }

  if (!correlationMatrix) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Insufficient data for correlation analysis</p>
        <p className="text-sm text-gray-400 mt-2">Need at least 10 assessments</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Correlation Analysis</h2>
        <p className="text-sm text-gray-600 mt-1">
          Discover relationships between assessment parameters and performance factors
        </p>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Key Insights
          </h3>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Correlation Matrix Heatmap */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parameter Correlation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700"></th>
                {correlationMatrix.variables.map((v: string) => (
                  <th
                    key={v}
                    className="px-4 py-2 text-sm font-medium text-gray-700 text-center"
                  >
                    {v.replace(/_/g, ' ').substring(0, 15)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlationMatrix.matrix.map((row: number[], i: number) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-700">
                    {correlationMatrix.variables[i].replace(/_/g, ' ').substring(0, 15)}
                  </td>
                  {row.map((value, j) => (
                    <td key={j} className="px-4 py-2 text-center">
                      <div
                        className={`inline-block px-3 py-1 rounded text-white text-sm font-medium ${getCorrelationColor(value)}`}
                        title={`Correlation: ${value.toFixed(3)}`}
                      >
                        {value.toFixed(2)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Values range from -1 (negative correlation) to +1 (positive correlation). Darker blue indicates stronger correlation.
        </p>
      </div>

      {/* Top Correlations */}
      {correlationMatrix.insights.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Correlations</h3>
          <div className="space-y-3">
            {correlationMatrix.insights.slice(0, 5).map((insight: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {insight.variable1.replace(/_/g, ' ')} ↔ {insight.variable2.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        insight.significance === 'high'
                          ? 'bg-green-100 text-green-800'
                          : insight.significance === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {insight.significance}
                    </span>
                    <span className="text-sm font-bold text-primary-600">
                      {insight.correlation > 0 ? '+' : ''}
                      {insight.correlation.toFixed(3)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{insight.insight}</p>
                <div className="mt-2 text-xs text-gray-500">
                  R² = {insight.rSquared.toFixed(3)} • Sample size: {insight.sampleSize}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CorrelationAnalysis
