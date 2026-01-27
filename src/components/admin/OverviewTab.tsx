import { useState, useEffect } from 'react'
import { Clock, Award, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { LineChart, Line } from 'recharts'
import { fetchRecentActivity, getTopPerformers, fetchMonthlyTrends } from '@/utils/adminQueries'
import { RecentActivity, TopPerformer, MonthlyTrend } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import SmartSearch from '@/components/SmartSearch'
import toast from 'react-hot-toast'

const OverviewTab = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [activity, performers, trends] = await Promise.all([
          fetchRecentActivity(20),
          getTopPerformers(5, 'month'),
          fetchMonthlyTrends(12),
        ])
        setRecentActivity(activity || [])
        setTopPerformers(performers || [])
        setMonthlyTrends(trends || [])
      } catch (error: any) {
        console.error('Error loading overview data:', error)
        const errorMessage = error?.message || 'Failed to load overview data'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []) // Component remounts when tab switches due to key prop

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  // Assessment distribution by rating range
  const distributionData = [
    { range: '1-2', count: 0 },
    { range: '2-3', count: 0 },
    { range: '3-4', count: 0 },
    { range: '4-5', count: 0 },
  ]

  recentActivity.forEach((activity) => {
    const score = activity.average_score
    if (score >= 1 && score < 2) distributionData[0].count++
    else if (score >= 2 && score < 3) distributionData[1].count++
    else if (score >= 3 && score < 4) distributionData[2].count++
    else if (score >= 4 && score <= 5) distributionData[3].count++
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading overview data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Smart Search */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Search</h3>
          <p className="text-sm text-gray-600 mb-4">
            Ask questions in natural language to find insights quickly
          </p>
          <SmartSearch
            onSearch={(query, results) => {
              toast.success(`Searching for: ${query}`)
              // Handle search results
            }}
            placeholder="Try: 'Show trainers who improved this quarter' or 'Find managers with low activity'"
          />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{activity.assessor_name}</span> assessed{' '}
                    <span className="font-semibold">{activity.trainer_name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.assessment_date).toLocaleDateString()} • Score:{' '}
                    <span className="font-medium">{activity.average_score.toFixed(2)}</span>
                  </p>
                </div>
                <div className="text-xs text-gray-400">{getTimeAgo(activity.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Top Performers This Month</h3>
          </div>
          {topPerformers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No performers data available</p>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div
                  key={performer.trainer_id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-500 text-white rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{performer.trainer_name}</p>
                      <p className="text-sm text-gray-600">{performer.team_name || 'No Team'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      {performer.average_rating.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {performer.assessment_count} assessment{performer.assessment_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessment Distribution */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Assessment Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" stroke="#6b7280" />
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
        </div>
      </div>

      {/* Monthly Assessment Trend */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Assessment Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="assessment_count"
              name="Assessments"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default OverviewTab
