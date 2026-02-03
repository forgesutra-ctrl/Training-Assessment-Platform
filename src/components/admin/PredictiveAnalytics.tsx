import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3 } from 'lucide-react'
import { fetchAllTrainersWithStats } from '@/utils/adminQueries'
import { TrainerWithStats } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const PredictiveAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [trainers, setTrainers] = useState<TrainerWithStats[]>([])
  const [atRiskTrainers, setAtRiskTrainers] = useState<TrainerWithStats[]>([])
  const [predictions, setPredictions] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllTrainersWithStats('all-time')
      setTrainers(data || [])

      // Identify at-risk trainers with detailed risk metadata
      const atRiskWithDetails = (data || []).filter((t) => {
        const trend = t.trend === 'down'
        const currentLow = t.current_month_avg > 0 && t.current_month_avg < 3.0
        const declining = t.trend_percentage < -10
        const lowQuarter = t.quarter_avg > 0 && t.quarter_avg < 3.2
        return (currentLow && trend) || (declining && t.current_month_avg < 3.5) || (lowQuarter && trend)
      }).map((t) => {
        const reasons: string[] = []
        const suggestedActions: string[] = []
        let riskLevel: 'high' | 'medium' = 'medium'

        if (t.current_month_avg > 0 && t.current_month_avg < 3.0) {
          reasons.push(`Current month average is ${t.current_month_avg.toFixed(2)}/5.0 (below 3.0 threshold)`)
          suggestedActions.push('Schedule 1:1 review with reporting manager')
          riskLevel = 'high'
        }
        if (t.trend === 'down' && t.trend_percentage < -10) {
          reasons.push(`Declining trend: ${t.trend_percentage.toFixed(1)}% vs previous month`)
          if (!suggestedActions.includes('Schedule 1:1 review with reporting manager')) {
            suggestedActions.push('Review recent feedback and identify root cause')
          }
          if (t.trend_percentage < -20) riskLevel = 'high'
        }
        if (t.quarter_avg > 0 && t.quarter_avg < 3.2 && t.trend === 'down') {
          reasons.push(`Quarter average ${t.quarter_avg.toFixed(2)}/5.0 with downward trend`)
          suggestedActions.push('Consider peer mentoring or targeted training')
        }
        if (t.total_assessments < 3 && t.current_month_avg < 3.5) {
          reasons.push(`Limited assessment history (${t.total_assessments} assessment(s)) with below-target score`)
          suggestedActions.push('Increase assessment frequency to get clearer trend')
        }
        if (reasons.length === 0) {
          reasons.push('Below target performance with negative or flat trend')
          suggestedActions.push('Schedule 1:1 to agree improvement plan')
        }

        return {
          ...t,
          riskLevel,
          reasons,
          suggestedActions,
        }
      })
      setAtRiskTrainers(atRiskWithDetails)

      // Generate predictions
      const preds = data.slice(0, 10).map((trainer) => {
        const current = trainer.current_month_avg || trainer.all_time_avg
        const trend = trainer.trend === 'up' ? 0.1 : trainer.trend === 'down' ? -0.1 : 0
        const predicted = Math.max(1, Math.min(5, current + trend * 3)) // Predict 3 months ahead

        return {
          trainerId: trainer.id,
          trainerName: trainer.full_name,
          current: current,
          predicted: predicted,
          confidence: 0.7,
          trend: trainer.trend,
        }
      })
      setPredictions(preds)
    } catch (error: any) {
      console.error('Error loading predictive analytics:', error)
      const errorMessage = error?.message || 'Failed to load predictive analytics'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const predictTrainingNeeds = () => {
    const needs: Record<string, number> = {}
    trainers.forEach((trainer) => {
      // This would use actual parameter data - simplified for now
      if (trainer.all_time_avg < 3.5) {
        needs['General Development'] = (needs['General Development'] || 0) + 1
      }
    })
    return Object.entries(needs).map(([skill, count]) => ({ skill, count }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading predictive analytics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadData()
          }}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  const trainingNeeds = predictTrainingNeeds()

  return (
    <div className="space-y-6">
      {/* At-Risk Trainers — detailed risk information */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">At-Risk Trainers</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Trainers likely to score below 3.0 in the next assessment period. Expand each card for risk reasons and suggested actions.
        </p>
        {atRiskTrainers.length === 0 ? (
          <p className="text-sm text-gray-500">No at-risk trainers identified.</p>
        ) : (
          <div className="space-y-4">
            {atRiskTrainers.slice(0, 10).map((trainer: any) => (
              <div
                key={trainer.id}
                className={`rounded-lg border-2 overflow-hidden ${
                  trainer.riskLevel === 'high'
                    ? 'bg-red-50 border-red-300'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{trainer.full_name}</p>
                      {trainer.team_name && (
                        <p className="text-sm text-gray-600">Team: {trainer.team_name}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-700">
                        <span>Current month: <strong>{Number(trainer.current_month_avg || 0).toFixed(2)}</strong>/5.0</span>
                        <span>Quarter avg: <strong>{Number(trainer.quarter_avg || 0).toFixed(2)}</strong>/5.0</span>
                        <span>All-time: <strong>{Number(trainer.all_time_avg || 0).toFixed(2)}</strong>/5.0</span>
                        <span>Assessments: <strong>{trainer.total_assessments}</strong></span>
                        <span className={trainer.trend === 'down' ? 'text-red-600' : trainer.trend === 'up' ? 'text-green-600' : ''}>
                          Trend: {trainer.trend === 'down' ? `↓ ${trainer.trend_percentage}%` : trainer.trend === 'up' ? `↑ +${trainer.trend_percentage}%` : '→ stable'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                        trainer.riskLevel === 'high'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {trainer.riskLevel === 'high' ? 'High risk' : 'Medium risk'}
                    </span>
                  </div>

                  {/* Risk reasons */}
                  <div className="mt-4 pt-3 border-t border-gray-200/80">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Why at risk</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {(trainer.reasons || []).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested actions */}
                  <div className="mt-3 pt-3 border-t border-gray-200/80">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested actions</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {(trainer.suggestedActions || []).map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Predictions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Predictions</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Forecasted performance for next 3 months based on current trends
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trainer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Predicted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.map((pred) => (
                <tr key={pred.trainerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {pred.trainerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pred.current.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`font-semibold ${
                        pred.predicted > pred.current
                          ? 'text-green-600'
                          : pred.predicted < pred.current
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {pred.predicted.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {pred.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : pred.trend === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Training Needs Forecast */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Training Needs Forecast</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Skills that need development based on current performance
        </p>
        {trainingNeeds.length === 0 ? (
          <p className="text-sm text-gray-500">No specific training needs identified.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trainingNeeds}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="skill" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Disclaimer */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Predictive Analytics Disclaimer</p>
            <p>
              Predictions are based on historical trends and statistical models. They should be
              used as guidance, not definitive forecasts. Actual performance may vary based on
              various factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PredictiveAnalytics
