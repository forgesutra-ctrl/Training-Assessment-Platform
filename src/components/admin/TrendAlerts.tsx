import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, TrendingDown, TrendingUp, AlertCircle, X, Target, ChevronDown, ChevronUp, ExternalLink, BarChart3 } from 'lucide-react'
import { generateTrendAlerts, detectManagerInactivity, TrendAlert } from '@/utils/trendAnalysis'
import { fetchAllTrainersWithStats, fetchManagerActivity } from '@/utils/adminQueries'
import { fetchTrainerAssessments } from '@/utils/trainerAssessments'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const TrendAlerts = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<TrendAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const allAlerts: TrendAlert[] = []
      const trainers = await fetchAllTrainersWithStats('all-time')
      const managers = await fetchManagerActivity()

      for (const trainer of trainers.slice(0, 20)) {
        try {
          const assessments = await fetchTrainerAssessments(trainer.id)
          if (assessments.length >= 3) {
            const trainerAlerts = generateTrendAlerts(trainer.id, assessments)
            trainerAlerts.forEach((a) => {
              a.trainerName = trainer.full_name
              allAlerts.push(a)
            })
          }
        } catch (e) {
          // Skip if can't fetch
        }
      }

      managers.forEach((manager) => {
        const inactivity = detectManagerInactivity(
          manager.id,
          manager.last_assessment_date,
          30
        )
        if (inactivity) {
          inactivity.managerName = manager.full_name
          allAlerts.push(inactivity)
        }
      })

      allAlerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })

      setAlerts(allAlerts)
    } catch (error: any) {
      console.error('Error loading trend alerts:', error)
      toast.error('Failed to load trend alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
    toast.success('Alert dismissed')
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'inconsistent':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'skill_gap':
        return <Target className="w-5 h-5 text-orange-600" />
      case 'inactivity':
        return <AlertTriangle className="w-5 h-5 text-blue-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      case 'low':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Analyzing trends..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Trend Alerts</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadAlerts()
          }}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trend Alerts</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automated detection of performance patterns and anomalies
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="px-4 py-2 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No trend alerts at this time</p>
          <p className="text-sm text-gray-400 mt-2">Alerts will appear when patterns are detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => {
            const hasDetails = alert.data && (
              alert.data.scoresWithDates?.length ||
              alert.data.assessmentCount != null ||
              alert.data.daysSince != null ||
              (alert.data.mean != null && alert.data.stdDev != null)
            )
            const isExpanded = expandedId === alert.id

            return (
              <div
                key={alert.id}
                className={`card border-2 ${getAlertColor(alert.severity)} overflow-hidden`}
              >
                <div className="flex items-start gap-4 p-4">
                  <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              alert.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : alert.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                          {(alert.trainerName || alert.managerName) && (
                            <span className="text-xs font-medium text-gray-700">
                              • {alert.trainerName ?? alert.managerName}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        {alert.parameterLabel && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            Category: {alert.parameterLabel}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {hasDetails && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                            className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>Hide details <ChevronUp className="w-3.5 h-3.5" /></>
                            ) : (
                              <>View details <ChevronDown className="w-3.5 h-3.5" /></>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Dismiss alert"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && hasDetails && alert.data && (
                  <div className="border-t border-gray-200 bg-white/60 px-4 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Who: </span>
                        <span className="text-gray-900">{alert.trainerName ?? alert.managerName ?? '—'}</span>
                      </div>
                      {(alert.data.periodStart || alert.data.periodEnd) && (
                        <div>
                          <span className="font-medium text-gray-700">Period: </span>
                          <span className="text-gray-900">
                            {alert.data.periodStart && alert.data.periodEnd
                              ? `${new Date(alert.data.periodStart).toLocaleDateString()} – ${new Date(alert.data.periodEnd).toLocaleDateString()}`
                              : alert.data.periodEnd
                              ? new Date(alert.data.periodEnd).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                      )}
                      {alert.data.assessmentCount != null && (
                        <div>
                          <span className="font-medium text-gray-700">Assessments in scope: </span>
                          <span className="text-gray-900">{alert.data.assessmentCount}</span>
                        </div>
                      )}
                      {alert.data.daysSince != null && (
                        <div>
                          <span className="font-medium text-gray-700">Days since last assessment: </span>
                          <span className="text-gray-900">{alert.data.daysSince}</span>
                          {alert.data.lastAssessmentDate && (
                            <span className="text-gray-600 ml-1">
                              (last: {new Date(alert.data.lastAssessmentDate).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      )}
                      {alert.data.mean != null && (
                        <div>
                          <span className="font-medium text-gray-700">Mean score: </span>
                          <span className="text-gray-900">{alert.data.mean.toFixed(2)}</span>
                        </div>
                      )}
                      {alert.data.stdDev != null && (
                        <div>
                          <span className="font-medium text-gray-700">Std deviation: </span>
                          <span className="text-gray-900">{alert.data.stdDev.toFixed(2)}</span>
                        </div>
                      )}
                      {(alert.data.minScore != null || alert.data.maxScore != null) && (
                        <div>
                          <span className="font-medium text-gray-700">Score range: </span>
                          <span className="text-gray-900">
                            {alert.data.minScore?.toFixed(2) ?? '—'} – {alert.data.maxScore?.toFixed(2) ?? '—'}
                          </span>
                        </div>
                      )}
                      {alert.data.average != null && alert.parameterLabel && (
                        <div>
                          <span className="font-medium text-gray-700">{alert.parameterLabel} avg: </span>
                          <span className="text-gray-900">{alert.data.average.toFixed(2)}/5</span>
                        </div>
                      )}
                    </div>

                    {alert.data.scoresWithDates && alert.data.scoresWithDates.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                          <BarChart3 className="w-4 h-4" />
                          Score history (date → score)
                        </div>
                        <div className="overflow-x-auto rounded border border-gray-200">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700">Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {alert.data.scoresWithDates.map((row: { date: string; score: number }, i: number) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-900">{new Date(row.date).toLocaleDateString()}</td>
                                  <td className="px-3 py-2 text-right font-medium text-gray-900">{row.score.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      {alert.trainerId && (
                        <button
                          onClick={() => navigate('/admin/dashboard?tab=trainer-performance')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View in Trainer Performance
                        </button>
                      )}
                      {alert.managerId && (
                        <button
                          onClick={() => navigate('/admin/dashboard?tab=manager-activity')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View in Manager Activity
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      <div className="card bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">
              {visibleAlerts.filter((a) => a.severity === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {visibleAlerts.filter((a) => a.severity === 'medium').length}
            </div>
            <div className="text-sm text-gray-600">Medium Priority</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {visibleAlerts.filter((a) => a.severity === 'low').length}
            </div>
            <div className="text-sm text-gray-600">Low Priority</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendAlerts
