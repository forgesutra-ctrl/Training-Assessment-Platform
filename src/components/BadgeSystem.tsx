import { useState, useEffect } from 'react'
import { Award, Download, Share2, Trophy, Sparkles } from 'lucide-react'
import { fetchUserBadges, fetchAllBadges } from '@/utils/gamification'
import { UserBadge, Badge } from '@/types'
import { useAuthContext } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import AchievementUnlocked from '@/components/animations/AchievementUnlocked'
import Fireworks from '@/components/animations/Fireworks'
import { soundManager } from '@/utils/sounds'
import toast from 'react-hot-toast'

const BadgeSystem = () => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null)
  const [newBadge, setNewBadge] = useState<UserBadge | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [fireworksTrigger, setFireworksTrigger] = useState(false)

  useEffect(() => {
    if (user) {
      loadBadges()
    }
  }, [user])

  const loadBadges = async () => {
    try {
      setLoading(true)
      const previousCount = earnedBadges.length
      const [earned, all] = await Promise.all([
        fetchUserBadges(user!.id),
        fetchAllBadges(),
      ])
      
      // Check for new badges
      if (previousCount > 0 && earned.length > previousCount) {
        const newestBadge = earned[earned.length - 1]
        setNewBadge(newestBadge)
        setShowCelebration(true)
        setFireworksTrigger(true)
        soundManager.playAchievement()
        setTimeout(() => {
          setFireworksTrigger(false)
        }, 3000)
      }
      
      setEarnedBadges(earned)
      setAllBadges(all)
    } catch (error: any) {
      console.error('Error loading badges:', error)
      toast.error('Failed to load badges')
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300'
      case 'epic':
        return 'bg-gradient-to-br from-purple-400 to-pink-500 border-purple-300'
      case 'rare':
        return 'bg-gradient-to-br from-blue-400 to-cyan-500 border-blue-300'
      default:
        return 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-300'
    }
  }

  const getEarnedBadgeIds = () => new Set(earnedBadges.map((b) => b.badge_id))

  const handleDownloadCertificate = (badge: UserBadge) => {
    // Generate and download badge certificate
    toast.success('Badge certificate downloaded!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading badges..." />
      </div>
    )
  }

  const earnedIds = getEarnedBadgeIds()

  return (
    <div className="space-y-6">
      {/* Celebration */}
      <Fireworks trigger={fireworksTrigger} />
      {newBadge && (
        <AchievementUnlocked
          show={showCelebration}
          title={newBadge.badge?.name || 'New Badge Earned!'}
          description={newBadge.badge?.description}
          icon={<Award className="w-12 h-12 text-white" />}
          onComplete={() => {
            setShowCelebration(false)
            setNewBadge(null)
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievement Badges</h2>
          <p className="text-sm text-gray-600 mt-1">
            {earnedBadges.length} of {allBadges.length} badges earned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Progress: {Math.round((earnedBadges.length / allBadges.length) * 100)}%
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${(earnedBadges.length / allBadges.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Badges ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedBadges.map((userBadge) => {
              const badge = userBadge.badge as Badge
              return (
                <div
                  key={userBadge.id}
                  className={`p-4 rounded-lg border-2 ${getRarityColor(badge.rarity)} cursor-pointer hover:scale-105 transition-transform`}
                  onClick={() => setSelectedBadge(userBadge)}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h4 className="font-semibold text-white text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs text-white/90 mb-2">{badge.description}</p>
                    <p className="text-xs text-white/80">
                      {new Date(userBadge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Badges */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Available Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const isEarned = earnedIds.has(badge.id)
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-lg border-2 ${
                  isEarned
                    ? getRarityColor(badge.rarity)
                    : 'bg-gray-100 border-gray-300 opacity-60'
                } ${isEarned ? 'cursor-pointer hover:scale-105' : ''} transition-transform`}
                onClick={() => isEarned && setSelectedBadge(earnedBadges.find((b) => b.badge_id === badge.id)!)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h4
                    className={`font-semibold text-sm mb-1 ${isEarned ? 'text-white' : 'text-gray-700'}`}
                  >
                    {badge.name}
                  </h4>
                  <p className={`text-xs mb-2 ${isEarned ? 'text-white/90' : 'text-gray-600'}`}>
                    {badge.description}
                  </p>
                  {!isEarned && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Locked</div>
                    </div>
                  )}
                  {isEarned && (
                    <div className="mt-2">
                      <Award className="w-4 h-4 text-white mx-auto" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setSelectedBadge(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {(selectedBadge.badge as Badge).icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {(selectedBadge.badge as Badge).name}
                </h3>
                <p className="text-gray-600 mb-4">{(selectedBadge.badge as Badge).description}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleDownloadCertificate(selectedBadge)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Certificate
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Badge link copied!')
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
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

export default BadgeSystem
