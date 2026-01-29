import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Award, BookOpen, Users } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getTrainerRecommendations, Recommendation } from '@/utils/recommendations'
import { fetchTrainerAssessments } from '@/utils/trainerAssessments'
import { TrainerAssessmentWithDetails, ASSESSMENT_STRUCTURE } from '@/types'
import { calculateCategoryAveragesAcrossAssessments } from '@/utils/trainerStats'
import { SHOW_PEER_AND_LEADERBOARD } from '@/constants/featureFlags'
import ActionRequiredWidget from './ActionRequiredWidget'
import ActivityFeed from './ActivityFeed'
import DataRefresh from './DataRefresh'
import LoadingSpinner from '../LoadingSpinner'
import toast from 'react-hot-toast'

const TrainerSmartDashboard = () => {
  const { user, profile } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [assessments, setAssessments] = useState<TrainerAssessmentWithDetails[]>([])
  const [performanceData, setPerformanceData] = useState({
    currentMonth: 0,
    lastMonth: 0,
    change: 0,
    improving: [] as string[],
    needsAttention: [] as string[],
    percentile: 0,
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load recommendations
      const recs = await getTrainerRecommendations(user!.id)
      setRecommendations(recs)

      // Load assessments
      const assessmentData = await fetchTrainerAssessments(user!.id)
      setAssessments(assessmentData)

      // Calculate performance metrics
      calculatePerformanceMetrics(assessmentData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculatePerformanceMetrics = (assessmentData: TrainerAssessmentWithDetails[]) => {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthBeforeLast = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    const currentMonthAssessments = assessmentData.filter(
      (a) => new Date(a.assessment_date) >= currentMonth
    )
    const lastMonthAssessments = assessmentData.filter((a) => {
      const date = new Date(a.assessment_date)
      return date >= lastMonth && date < currentMonth
    })

    // Calculate averages
    const calculateAvg = (assessments: TrainerAssessmentWithDetails[]) => {
      if (assessments.length === 0) return 0
      return (
        assessments.reduce((sum, a) => sum + a.average_score, 0) / assessments.length
      )
    }

    const currentAvg = calculateAvg(currentMonthAssessments)
    const lastAvg = calculateAvg(lastMonthAssessments)
    const change = lastAvg > 0 ? ((currentAvg - lastAvg) / lastAvg) * 100 : 0

    // Find improving and needs attention categories (using 5 categories instead of 6 parameters)
    const currentCategoryAvgs = calculateCategoryAveragesAcrossAssessments(currentMonthAssessments)
    const lastCategoryAvgs = calculateCategoryAveragesAcrossAssessments(lastMonthAssessments)

    const improving: string[] = []
    const needsAttention: string[] = []

    currentCategoryAvgs.forEach((currentCat) => {
      const lastCat = lastCategoryAvgs.find((c) => c.categoryId === currentCat.categoryId)
      if (lastCat && currentCat.parameterCount > 0) {
        const change = currentCat.average - lastCat.average

        if (change > 0.2) {
          improving.push(currentCat.categoryName)
        } else if (change < -0.2 || currentCat.average < 3.0) {
          needsAttention.push(currentCat.categoryName)
        }
      }
    })

    // Calculate percentile (simplified - would need all trainer data)
    const percentile = currentAvg >= 4.5 ? 90 : currentAvg >= 4.0 ? 70 : currentAvg >= 3.5 ? 50 : 30

    setPerformanceData({
      currentMonth: currentAvg,
      lastMonth: lastAvg,
      change,
      improving,
      needsAttention,
      percentile,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name}!</h2>
          <p className="text-sm text-gray-600 mt-1">Your performance at a glance</p>
        </div>
        <DataRefresh onRefresh={loadDashboardData} />
      </div>

      {/* Performance at a Glance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Current Month</span>
            {performanceData.change > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : performanceData.change < 0 ? (
              <TrendingDown className="w-5 h-5 text-red-600" />
            ) : null}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {performanceData.currentMonth > 0
              ? performanceData.currentMonth.toFixed(2)
              : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">
            {performanceData.change !== 0 && (
              <span
                className={performanceData.change > 0 ? 'text-green-600' : 'text-red-600'}
              >
                {performanceData.change > 0 ? '+' : ''}
                {performanceData.change.toFixed(1)}% vs last month
              </span>
            )}
          </div>
        </div>

        {SHOW_PEER_AND_LEADERBOARD && (
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Peer Comparison</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              Top {performanceData.percentile}%
            </div>
            <div className="text-sm text-gray-600">You're performing above average</div>
          </div>
        )}

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Total Assessments</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{assessments.length}</div>
          <div className="text-sm text-gray-600">All-time assessments</div>
        </div>
      </div>

      {/* What's Improving vs Needs Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {performanceData.improving.length > 0 && (
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">What's Improving</h3>
            </div>
            <div className="space-y-2">
              {performanceData.improving.map((param, index) => (
                <div
                  key={index}
                  className="p-3 bg-white rounded-lg border border-green-200"
                >
                  <p className="font-medium text-gray-900 capitalize">{param}</p>
                  <p className="text-sm text-gray-600">Showing positive trend</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {performanceData.needsAttention.length > 0 && (
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
            </div>
            <div className="space-y-2">
              {performanceData.needsAttention.map((param, index) => (
                <div
                  key={index}
                  className="p-3 bg-white rounded-lg border border-orange-200"
                >
                  <p className="font-medium text-gray-900 capitalize">{param}</p>
                  <p className="text-sm text-gray-600">Focus on improvement</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Learning Recommendations (AI: weakest areas + assessment overall comments) */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Learning Recommendations</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Based on your least performed areas and feedback from your assessments (overall comments).
        </p>
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={
                  rec.id === 'least-performed-areas'
                    ? 'p-4 bg-amber-50 rounded-lg border border-amber-200'
                    : 'p-3 bg-gray-50 rounded-lg border border-gray-200'
                }
              >
                <p className="font-medium text-gray-900">{rec.title}</p>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Complete at least one assessment to see least performed areas and AI-powered learning recommendations based on your feedback.
          </p>
        )}
      </div>

      {/* Activity Feed */}
      <ActivityFeed limit={5} showFilters={false} />
    </div>
  )
}

export default TrainerSmartDashboard
