import { useState, useEffect } from 'react'
import { AlertTriangle, Activity, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getAdminRecommendations, Recommendation } from '@/utils/recommendations'
import { fetchPlatformStats } from '@/utils/adminQueries'
import { PlatformStats } from '@/types'
import ActionRequiredWidget from './ActionRequiredWidget'
import ActivityFeed from './ActivityFeed'
import DataRefresh from './DataRefresh'
import LoadingSpinner from '../LoadingSpinner'
import toast from 'react-hot-toast'

const AdminSmartDashboard = () => {
  const { profile } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalTrainers: 0,
    totalAssessmentsThisMonth: 0,
    platformAverageRating: 0,
    assessmentActivityRate: 0,
  })
  const [criticalAlerts, setCriticalAlerts] = useState<Array<{
    type: string
    message: string
    count: number
  }>>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load recommendations
      const recs = await getAdminRecommendations()
      setRecommendations(recs)

      // Load platform stats
      const stats = await fetchPlatformStats()
      setPlatformStats(stats)

      // Extract critical alerts from recommendations
      const alerts = recs
        .filter((r) => r.type === 'alert' && r.priority === 'high')
        .map((r) => ({
          type: r.title,
          message: r.description,
          count: r.metadata?.trainers?.length || r.metadata?.managers?.length || 1,
        }))
      setCriticalAlerts(alerts)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateHealthScore = (): number => {
    // Platform health score based on various factors
    let score = 100

    // Deduct for low engagement
    if (platformStats.assessmentActivityRate < 1) {
      score -= 20
    } else if (platformStats.assessmentActivityRate < 2) {
      score -= 10
    }

    // Deduct for low average rating
    if (platformStats.platformAverageRating < 3.0) {
      score -= 30
    } else if (platformStats.platformAverageRating < 3.5) {
      score -= 15
    }

    // Deduct for critical alerts
    score -= criticalAlerts.length * 5

    return Math.max(0, Math.min(100, score))
  }

  const healthScore = calculateHealthScore()
  const healthColor =
    healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Platform overview and critical alerts</p>
        </div>
        <DataRefresh onRefresh={loadDashboardData} autoRefreshInterval={30} />
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
          </div>
          <div className="space-y-3">
            {criticalAlerts.map((alert, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded-lg border border-red-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.type}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    {alert.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Platform Health</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{healthScore}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                healthColor === 'green'
                  ? 'bg-green-500'
                  : healthColor === 'yellow'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-600">Total Trainers</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{platformStats.totalTrainers}</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-600">Assessments This Month</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {platformStats.totalAssessmentsThisMonth}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-600">Activity Rate</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {platformStats.assessmentActivityRate.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">per trainer</div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <ActionRequiredWidget recommendations={recommendations} userRole="admin" />
      )}

      {/* Quick Action Shortcuts */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/admin/dashboard?tab=user-management'}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
          >
            <Users className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-gray-900">Manage Users</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/dashboard?tab=trainer-performance'}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
          >
            <TrendingUp className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-gray-900">View Performance</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/dashboard?tab=manager-activity'}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
          >
            <Activity className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-gray-900">Manager Activity</p>
          </button>
          <button
            onClick={() => window.location.href = '/admin/dashboard?tab=trend-alerts'}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
          >
            <AlertTriangle className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-gray-900">Trend Alerts</p>
          </button>
        </div>
      </div>

      {/* Today's Highlights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Highlights</h3>
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{platformStats.totalAssessmentsThisMonth}</span> assessments
              completed this month
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-900">
              Platform average rating: <span className="font-medium">
                {platformStats.platformAverageRating.toFixed(2)}/5.0
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed limit={10} showFilters={true} />
    </div>
  )
}

export default AdminSmartDashboard
