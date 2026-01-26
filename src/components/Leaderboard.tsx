import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Settings, Eye, EyeOff } from 'lucide-react'
import { fetchLeaderboard, getLeaderboardPreference, updateLeaderboardPreference } from '@/utils/gamification'
import { LeaderboardEntry, LeaderboardPreference } from '@/types'
import { useAuthContext } from '@/contexts/AuthContext'
import { fetchAllTrainersWithStats } from '@/utils/adminQueries'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const Leaderboard = () => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [preference, setPreference] = useState<LeaderboardPreference | null>(null)
  const [boardType, setBoardType] = useState<'top_performers' | 'most_improved' | 'consistency' | 'parameter'>('top_performers')
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'all-time'>('month')
  const [parameter, setParameter] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, boardType, period, parameter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pref, trainers] = await Promise.all([
        getLeaderboardPreference(user!.id),
        fetchAllTrainersWithStats(period),
      ])

      setPreference(pref)

      // Build leaderboard from trainer data
      let entries: LeaderboardEntry[] = []

      if (boardType === 'top_performers') {
        entries = trainers
          .filter((t) => {
            // Only show if user opted in or it's the current user
            if (!pref?.opt_in && t.id !== user!.id) return false
            return true
          })
          .map((t, index) => ({
            rank: index + 1,
            user_id: t.id,
            user_name: pref?.show_name || t.id === user!.id ? t.full_name : 'Anonymous',
            team_name: t.team_name,
            score: t.current_month_avg || t.all_time_avg,
            metric: 'Average Rating',
            is_current_user: t.id === user!.id,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 20)
          .map((entry, index) => ({ ...entry, rank: index + 1 }))
      }

      setLeaderboard(entries)
    } catch (error: any) {
      console.error('Error loading leaderboard:', error)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleOptIn = async (optIn: boolean, showName: boolean) => {
    if (!user) return

    try {
      const updated = await updateLeaderboardPreference(user.id, optIn, showName)
      setPreference(updated)
      toast.success(optIn ? 'You\'ve opted into leaderboards!' : 'You\'ve opted out of leaderboards')
      loadData()
    } catch (error: any) {
      console.error('Error updating preference:', error)
      toast.error('Failed to update preference')
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{rank}</span>
  }

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300'
    }
    if (rank === 2) {
      return 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300'
    }
    if (rank === 3) {
      return 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300'
    }
    if (isCurrentUser) {
      return 'bg-primary-50 border-2 border-primary-300'
    }
    return 'bg-white border border-gray-200'
  }

  const currentUserRank = leaderboard.findIndex((e) => e.is_current_user) + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            See how you rank among your peers (opt-in required)
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>

      {/* Opt-in Notice */}
      {!preference?.opt_in && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Opt into Leaderboards</h3>
              <p className="text-sm text-blue-800 mb-3">
                Join the leaderboard to see how you rank! You can choose to show your name or appear anonymously.
              </p>
              <button
                onClick={() => handleOptIn(true, true)}
                className="btn-primary text-sm"
              >
                Join Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {preference?.opt_in && (
        <>
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leaderboard Type</label>
                <select
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="top_performers">Top Performers</option>
                  <option value="most_improved">Most Improved</option>
                  <option value="consistency">Consistency Champions</option>
                  <option value="parameter">Parameter Leaders</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="input-field"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="all-time">All Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" text="Loading leaderboard..." />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No leaderboard data available</p>
              </div>
            ) : (
              <>
                {/* Current User Position */}
                {currentUserRank > 0 && (
                  <div className="mb-6 p-4 bg-primary-50 border-2 border-primary-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Your Position</p>
                        <p className="text-2xl font-bold text-primary-600">
                          #{currentUserRank} out of {leaderboard.length}
                        </p>
                      </div>
                      <Award className="w-12 h-12 text-primary-600" />
                    </div>
                  </div>
                )}

                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 2nd Place */}
                    <div className="text-center">
                      <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
                        <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-700">2</div>
                        <div className="font-semibold text-gray-900 mt-2">
                          {leaderboard[1].user_name}
                        </div>
                        <div className="text-primary-600 font-bold mt-1">
                          {leaderboard[1].score.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {/* 1st Place */}
                    <div className="text-center">
                      <div className="bg-yellow-100 rounded-lg p-4 border-2 border-yellow-300">
                        <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-yellow-600">1</div>
                        <div className="font-semibold text-gray-900 mt-2">
                          {leaderboard[0].user_name}
                        </div>
                        <div className="text-primary-600 font-bold mt-1">
                          {leaderboard[0].score.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {/* 3rd Place */}
                    <div className="text-center">
                      <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-300">
                        <Medal className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">3</div>
                        <div className="font-semibold text-gray-900 mt-2">
                          {leaderboard[2].user_name}
                        </div>
                        <div className="text-primary-600 font-bold mt-1">
                          {leaderboard[2].score.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Leaderboard */}
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`p-4 rounded-lg ${getRankStyle(entry.rank, entry.is_current_user || false)} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-4">
                        {getRankIcon(entry.rank)}
                        <div>
                          <div className="font-semibold text-gray-900">
                            {entry.user_name}
                            {entry.is_current_user && (
                              <span className="ml-2 text-primary-600 text-sm">(You)</span>
                            )}
                          </div>
                          {entry.team_name && (
                            <div className="text-sm text-gray-600">{entry.team_name}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">
                          {entry.score.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{entry.metric}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowSettings(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Leaderboard Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">Opt into Leaderboards</div>
                    <div className="text-sm text-gray-600">
                      Show your ranking on leaderboards
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preference?.opt_in || false}
                    onChange={(e) => handleOptIn(e.target.checked, preference?.show_name || true)}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </label>
                {preference?.opt_in && (
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">Show My Name</div>
                      <div className="text-sm text-gray-600">
                        Display your name or appear as "Anonymous"
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preference?.show_name || false}
                      onChange={(e) => handleOptIn(true, e.target.checked)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leaderboard
