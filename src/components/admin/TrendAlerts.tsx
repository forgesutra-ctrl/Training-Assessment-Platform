import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, AlertCircle, X, Target } from 'lucide-react'
import { generateTrendAlerts, detectManagerInactivity, detectPlatformTrends, TrendAlert } from '@/utils/trendAnalysis'
import { fetchAllTrainersWithStats, fetchManagerActivity } from '@/utils/adminQueries'
import { fetchTrainerAssessments } from '@/utils/trainerAssessments'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const TrendAlerts = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<TrendAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAlerts()
  }, []) // Load on mount - component will remount when tab switches due to key prop

  const loadAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const allAlerts: TrendAlert[] = []

      // Load trainer assessments and detect trends
      const trainers = await fetchAllTrainersWithStats('all-time')
      for (const trainer of trainers.slice(0, 20)) {
        // Fetch assessments for each trainer
        try {
          const assessments = await fetchTrainerAssessments(trainer.id)
          if (assessments.length >= 3) {
            const trainerAlerts = generateTrendAlerts(trainer.id, assessments)
            allAlerts.push(...trainerAlerts)
          }
        } catch (e) {
          // Skip if can't fetch
        }
      }

      // Detect manager inactivity
      const managers = await fetchManagerActivity()
      managers.forEach((manager) => {
        const inactivity = detectManagerInactivity(
          manager.id,
          manager.last_assessment_date,
          30
        )
        if (inactivity) {
          allAlerts.push(inactivity)
        }
      })

      // Detect platform trends (would need all assessments)
      // const platformAlerts = detectPlatformTrends(allAssessments)
      // allAlerts.push(...platformAlerts)

      // Sort by severity
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
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`card border-2 ${getAlertColor(alert.severity)} flex items-start gap-4`}
            >
              <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.type)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
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
                    </div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    {alert.data && (
                      <div className="mt-2 text-sm text-gray-600">
                        {alert.parameter && (
                          <span>Parameter: {alert.parameter.replace(/_/g, ' ')}</span>
                        )}
                        {alert.data.daysSince && (
                          <span> • {alert.data.daysSince} days since last assessment</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title="Dismiss alert"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
