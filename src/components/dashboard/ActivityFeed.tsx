import { useState, useEffect } from 'react'
import { Activity, Filter, RefreshCw } from 'lucide-react'
import { fetchRecentActivity, subscribeToActivity, formatTimeAgo, ActivityItem } from '@/utils/activityFeed'
import LoadingSpinner from '../LoadingSpinner'

interface ActivityFeedProps {
  limit?: number
  showFilters?: boolean
}

const ActivityFeed = ({ limit = 10, showFilters = true }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'assessments' | 'achievements'>('all')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadActivities()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToActivity((newActivity) => {
      setActivities((prev) => [newActivity, ...prev].slice(0, limit))
      setLastUpdated(new Date())
    })

    return () => {
      unsubscribe()
    }
  }, [limit])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await fetchRecentActivity(limit)
      setActivities(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true
    if (filter === 'assessments') return activity.type === 'assessment_created'
    if (filter === 'achievements') return activity.type === 'goal_achieved' || activity.type === 'badge_earned'
    return true
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadActivities}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {showFilters && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'assessments', 'achievements'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    filter === f
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {formatTimeAgo(lastUpdated)}
        </p>
      </div>
    </div>
  )
}

export default ActivityFeed
