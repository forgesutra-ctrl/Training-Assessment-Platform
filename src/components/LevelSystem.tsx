import { useState, useEffect } from 'react'
import { Star, TrendingUp, Award, Sparkles, CheckCircle } from 'lucide-react'
import { fetchUserXP, fetchXPHistory, getLevelName, calculateLevel } from '@/utils/gamification'
import { UserXP, XPHistory } from '@/types'
import { useAuthContext } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const LevelSystem = () => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [xpData, setXPData] = useState<UserXP | null>(null)
  const [xpHistory, setXPHistory] = useState<XPHistory[]>([])
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    if (user) {
      loadXPData()
    }
  }, [user])

  const loadXPData = async () => {
    try {
      setLoading(true)
      const [xp, history] = await Promise.all([
        fetchUserXP(user!.id),
        fetchXPHistory(user!.id, 10),
      ])
      setXPData(xp)
      setXPHistory(history)

      // Check for recent level up
      if (xp && xp.level_up_at) {
        const levelUpDate = new Date(xp.level_up_at)
        const now = new Date()
        const hoursSince = (now.getTime() - levelUpDate.getTime()) / (1000 * 60 * 60)
        if (hoursSince < 24) {
          setShowLevelUp(true)
        }
      }
    } catch (error: any) {
      console.error('Error loading XP data:', error)
      toast.error('Failed to load level data')
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: number) => {
    if (level >= 6) return 'from-yellow-400 to-orange-500'
    if (level >= 5) return 'from-purple-400 to-pink-500'
    if (level >= 4) return 'from-blue-400 to-cyan-500'
    if (level >= 3) return 'from-green-400 to-emerald-500'
    if (level >= 2) return 'from-gray-400 to-gray-500'
    return 'from-gray-300 to-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading level data..." />
      </div>
    )
  }

  if (!xpData) {
    return (
      <div className="card text-center py-12">
        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No level data available yet</p>
        <p className="text-sm text-gray-400 mt-2">Start receiving assessments to earn XP!</p>
      </div>
    )
  }

  const levelName = getLevelName(xpData.current_level)

  return (
    <div className="space-y-6">

      {/* Current Level Card */}
      <div className={`card bg-gradient-to-br ${getLevelColor(xpData.current_level)} border-2 border-white shadow-lg`}>
        <div className="text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="w-12 h-12" />
            <div>
              <div className="text-sm opacity-90">Current Level</div>
              <div className="text-4xl font-bold">{xpData.current_level}</div>
              <div className="text-xl font-semibold">{levelName}</div>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <div className="text-3xl font-bold mb-1">{xpData.total_xp.toLocaleString()}</div>
            <div className="text-sm opacity-90">Total XP</div>
          </div>
          {xpData.current_level < 6 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress to Level {xpData.current_level + 1}</span>
                <span className="font-bold">
                  {xpData.level_xp} / {xpData.xp_for_next_level} XP
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${xpData.progress_to_next_level}%` }}
                />
              </div>
              <div className="text-xs mt-2 opacity-90">
                {xpData.xp_for_next_level - xpData.level_xp} XP needed for next level
              </div>
            </div>
          )}
        </div>
      </div>

      {/* XP History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Recent XP Activity
        </h3>
        {xpHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No XP history yet</p>
        ) : (
          <div className="space-y-3">
            {xpHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      +{entry.xp_amount} XP
                    </p>
                    <p className="text-sm text-gray-600">
                      {entry.description || entry.source.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Level Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Level Progression</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((level) => {
            const levelNames = ['', 'Novice', 'Learner', 'Competent', 'Proficient', 'Expert', 'Master']
            const levelXP = [0, 500, 1000, 2000, 4000, 8000, 8000]
            const isCurrent = level === xpData.current_level
            const isUnlocked = level <= xpData.current_level

            return (
              <div
                key={level}
                className={`p-3 rounded-lg border-2 ${
                  isCurrent
                    ? 'bg-primary-50 border-primary-300'
                    : isUnlocked
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isUnlocked ? (
                      <Star className={`w-5 h-5 ${isCurrent ? 'text-primary-600 fill-primary-600' : 'text-green-600 fill-green-600'}`} />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">
                        Level {level}: {levelNames[level]}
                        {isCurrent && <span className="ml-2 text-primary-600">(Current)</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {level === 1 ? '0' : levelXP[level - 1].toLocaleString()} - {level === 6 ? '∞' : levelXP[level].toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                  {isUnlocked && !isCurrent && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LevelSystem
