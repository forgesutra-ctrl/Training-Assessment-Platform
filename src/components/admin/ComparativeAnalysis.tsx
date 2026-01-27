import { useState, useEffect } from 'react'
import { GitCompare, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { fetchMonthlyTrends } from '@/utils/adminQueries'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const ComparativeAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [comparisonType, setComparisonType] = useState<'period' | 'team' | 'trainer' | 'parameter'>('period')
  const [period1, setPeriod1] = useState('2024-01')
  const [period2, setPeriod2] = useState('2024-02')
  const [comparisonData, setComparisonData] = useState<any>(null)

  useEffect(() => {
    if (comparisonType === 'period') {
      loadPeriodComparison()
    }
  }, [comparisonType, period1, period2])

  const [error, setError] = useState<string | null>(null)

  const loadPeriodComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch data for both periods
      const [data1, data2] = await Promise.all([
        fetchPeriodData(period1),
        fetchPeriodData(period2),
      ])

      setComparisonData({
        period1: { label: period1, data: data1 },
        period2: { label: period2, data: data2 },
        variance: calculateVariance(data1, data2),
      })
    } catch (error: any) {
      console.error('Error loading comparison:', error)
      const errorMessage = error?.message || 'Failed to load comparison data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchPeriodData = async (period: string) => {
    // Simplified - would fetch actual data
    return {
      averageScore: 4.2,
      totalAssessments: 45,
      trainersAssessed: 12,
    }
  }

  const calculateVariance = (data1: any, data2: any) => {
    return {
      scoreChange: ((data2.averageScore - data1.averageScore) / data1.averageScore) * 100,
      assessmentChange: ((data2.totalAssessments - data1.totalAssessments) / data1.totalAssessments) * 100,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading comparison..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <GitCompare className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadPeriodComparison()
          }}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparative Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">Compare periods, teams, trainers, or parameters</p>
        </div>
      </div>

      {/* Comparison Type Selector */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'period', label: 'Period vs Period' },
            { id: 'team', label: 'Team vs Team' },
            { id: 'trainer', label: 'Trainer vs Trainer' },
            { id: 'parameter', label: 'Parameter vs Parameter' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setComparisonType(type.id as any)}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                comparisonType === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-gray-900">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Period Comparison */}
      {comparisonType === 'period' && comparisonData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Period 1 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{comparisonData.period1.label}</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {comparisonData.period1.data.averageScore.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Assessments</div>
                <div className="text-2xl font-bold text-gray-900">
                  {comparisonData.period1.data.totalAssessments}
                </div>
              </div>
            </div>
          </div>

          {/* Period 2 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{comparisonData.period2.label}</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {comparisonData.period2.data.averageScore.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Assessments</div>
                <div className="text-2xl font-bold text-gray-900">
                  {comparisonData.period2.data.totalAssessments}
                </div>
              </div>
            </div>
          </div>

          {/* Variance Analysis */}
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Score Change</div>
                <div className="flex items-center gap-2">
                  {comparisonData.variance.scoreChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : comparisonData.variance.scoreChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      comparisonData.variance.scoreChange > 0
                        ? 'text-green-600'
                        : comparisonData.variance.scoreChange < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {comparisonData.variance.scoreChange > 0 ? '+' : ''}
                    {comparisonData.variance.scoreChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Assessment Change</div>
                <div className="flex items-center gap-2">
                  {comparisonData.variance.assessmentChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : comparisonData.variance.assessmentChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-600" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      comparisonData.variance.assessmentChange > 0
                        ? 'text-green-600'
                        : comparisonData.variance.assessmentChange < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {comparisonData.variance.assessmentChange > 0 ? '+' : ''}
                    {comparisonData.variance.assessmentChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparativeAnalysis
