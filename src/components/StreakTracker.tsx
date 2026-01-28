import { useState, useEffect } from 'react'
import { Flame, TrendingUp, Calendar, Award } from 'lucide-react'
import { fetchUserStreaks, updateStreak } from '@/utils/gamification'
import { Streak } from '@/types'
import { useAuthContext } from '@/contexts/AuthContext'
import { fetchTrainerAssessments } from '@/utils/trainerAssessments'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const StreakTracker = () => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [streaks, setStreaks] = useState<Streak[]>([])

  useEffect(() => {
    if (user) {
      loadStreaks()
    }
  }, [user])

  const loadStreaks = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await fetchUserStreaks(user.id).catch((error: any) => {
        // If table doesn't exist, RLS blocks access, or 403/406 errors, return empty array
        if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 403 || error.status === 406 || error.message?.includes('relation') || error.message?.includes('permission')) {
          console.warn('Streaks table not accessible:', error.message)
          return []
        }
        throw error
      })

      // If no streaks exist, check assessments and create initial streaks
      if (data.length === 0) {
        try {
          const assessments = await fetchTrainerAssessments(user.id)
          if (assessments.length > 0) {
            // Create improvement streak
            await updateStreak(user.id, 'improvement', assessments[0].assessment_date).catch(() => {})
            // Create assessment received streak
            await updateStreak(user.id, 'assessment_received', assessments[0].assessment_date).catch(() => {})
          }
          const updated = await fetchUserStreaks(user.id).catch(() => [])
          setStreaks(updated || [])
        } catch (error: any) {
          // If streak creation fails, just show empty state
          console.warn('Could not initialize streaks:', error.message)
          setStreaks([])
        }
      } else {
        setStreaks(data)
        
        // Check for milestone streaks
        data.forEach((streak) => {
          const milestone = getStreakMilestone(streak.current_streak)
          if (milestone && streak.current_streak % 7 === 0) {
            toast.success(`🔥 ${milestone.label}! ${streak.current_streak} day streak!`)
          }
        })
      }
    } catch (error: any) {
      console.error('Error loading streaks:', error)
      // Don't show error toast if gamification is disabled or tables don't exist
      if (error.code !== 'PGRST116' && error.code !== '42P01' && !error.message?.includes('relation') && !error.message?.includes('permission')) {
        toast.error('Failed to load streaks')
      }
      setStreaks([])
    } finally {
      setLoading(false)
    }
  }

  const getStreakLabel = (type: string) => {
    switch (type) {
      case 'improvement':
        return 'Improvement Streak'
      case 'assessment_received':
        return 'Assessment Streak'
      case 'consistency':
        return 'Consistency Streak'
      default:
        return type.replace(/_/g, ' ')
    }
  }

  const getStreakMilestone = (days: number) => {
    if (days >= 90) return { label: '90 Day Champion', icon: '🏆', color: 'text-yellow-600' }
    if (days >= 30) return { label: '30 Day Master', icon: '⭐', color: 'text-blue-600' }
    if (days >= 7) return { label: '7 Day Warrior', icon: '🔥', color: 'text-orange-600' }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading streaks..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Engagement Streaks</h2>
        <p className="text-sm text-gray-600 mt-1">Keep your momentum going! 🔥</p>
      </div>

      {/* Streaks */}
      {streaks.length === 0 ? (
        <div className="card text-center py-12">
          <div>
            <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          </div>
          <p className="text-gray-500 mb-2">No active streaks yet</p>
          <p className="text-sm text-gray-400">Start receiving assessments to build your streak!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streaks.map((streak) => {
          const milestone = getStreakMilestone(streak.current_streak)
          const daysSinceLast = streak.last_activity_date
            ? Math.floor(
                (Date.now() - new Date(streak.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)
              )
            : 999

          return (
            <div
              key={streak.type}
              className={`card border-2 ${
                daysSinceLast === 0
                  ? 'border-orange-300 bg-orange-50'
                  : daysSinceLast === 1
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Flame className="w-8 h-8 text-orange-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{getStreakLabel(streak.type)}</h3>
                    <p className="text-sm text-gray-600">
                      {streak.current_streak} day{streak.current_streak !== 1 ? 's' : ''} in a row
                    </p>
                  </div>
                </div>
                {milestone && (
                  <div className={`text-right ${milestone.color}`}>
                    <div className="text-2xl">{milestone.icon}</div>
                    <div className="text-xs font-medium">{milestone.label}</div>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-bold text-gray-900">{streak.current_streak} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (streak.current_streak / 90) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-xs text-gray-600">Longest Streak</div>
                  <div className="text-lg font-bold text-gray-900">{streak.longest_streak} days</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Last Activity</div>
                  <div className="text-sm font-medium text-gray-900">
                    {streak.last_activity_date
                      ? new Date(streak.last_activity_date).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
              </div>

              {/* Warning if about to break */}
              {daysSinceLast > 1 && daysSinceLast < 3 && (
                <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  ⚠️ Your streak is at risk! Keep it going today.
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}

      {/* Motivation */}
      <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-600" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Don't Break the Streak!</h3>
            <p className="text-sm text-gray-700">
              Consistency is key to improvement. Keep your streak alive by continuing to receive assessments and showing progress!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StreakTracker
