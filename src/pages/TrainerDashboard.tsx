import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Star,
  FileText,
  Award,
  Target,
  Calendar,
  LogOut,
  Menu,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trophy,
  BarChart3,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchTrainerAssessments, getLastAssessmentDate } from '@/utils/trainerAssessments'
import {
  calculateAverageRating,
  calculateParameterAverages,
  getBestParameter,
  getWorstParameter,
  getMonthlyTrend,
  filterAssessmentsByDateRange,
  getScoreColor,
  getScoreBgColor,
  getProgressPercentage,
  getDateRangeLabel,
  type DateRange,
} from '@/utils/trainerStats'
import { TrainerAssessmentWithDetails } from '@/types'
import AssessmentFeedbackModal from '@/components/AssessmentFeedbackModal'
import PerformanceInsights from '@/components/PerformanceInsights'
import BadgeSystem from '@/components/BadgeSystem'
import LevelSystem from '@/components/LevelSystem'
import GoalTracking from '@/components/GoalTracking'
import StreakTracker from '@/components/StreakTracker'
import Leaderboard from '@/components/Leaderboard'
import TrainerSmartDashboard from '@/components/dashboard/TrainerSmartDashboard'
import NotificationDropdown from '@/components/dashboard/NotificationDropdown'
import QuickActions from '@/components/dashboard/QuickActions'
import { checkAlerts } from '@/utils/notifications'
import LoadingSpinner from '@/components/LoadingSpinner'
import { isGamificationEnabled, checkAndAwardBadges } from '@/utils/gamification'
import toast from 'react-hot-toast'

const TrainerDashboard = () => {
  const { user, profile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState<TrainerAssessmentWithDetails[]>([])
  const [filteredAssessments, setFilteredAssessments] = useState<TrainerAssessmentWithDetails[]>([])
  const [dateRange, setDateRange] = useState<DateRange>('current-month')
  const [selectedAssessment, setSelectedAssessment] = useState<TrainerAssessmentWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'goals' | 'level' | 'streaks' | 'leaderboard'>('overview')
  const itemsPerPage = 10

  useEffect(() => {
    const loadData = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrainerDashboard.tsx:64',message:'loadData called',data:{hasUser:!!user,hasProfile:!!profile,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (!user || !profile) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrainerDashboard.tsx:72',message:'Before Promise.all',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const [assessmentsData, lastDate] = await Promise.all([
          fetchTrainerAssessments(user.id),
          getLastAssessmentDate(user.id),
        ])
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrainerDashboard.tsx:78',message:'After Promise.all',data:{assessmentsCount:assessmentsData?.length,hasLastDate:!!lastDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        setAssessments(assessmentsData)
        setLastAssessmentDate(lastDate)

        // Check and award badges if gamification is enabled
        if (isGamificationEnabled() && assessmentsData.length > 0) {
          try {
            const awarded = await checkAndAwardBadges(user.id, assessmentsData)
            if (awarded.length > 0) {
              toast.success(`🎉 You earned ${awarded.length} new badge${awarded.length > 1 ? 's' : ''}!`, {
                duration: 5000,
              })
            }
          } catch (error) {
            // Silently fail - badges are optional
            console.error('Error checking badges:', error)
          }
        }

        // Check for alerts
        const alerts = await checkAlerts(user.id, profile.role)
        const { notificationService } = await import('@/utils/notifications')
        for (const alert of alerts) {
          notificationService.addNotification(alert)
        }
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TrainerDashboard.tsx:102',message:'Error loading trainer data',data:{errorName:error?.name,errorMessage:error?.message,errorCode:error?.code,errorStatus:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error('Error loading trainer data:', error)
        toast.error('Failed to load assessment data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, profile])

  // Filter assessments when date range changes
  useEffect(() => {
    const filtered = filterAssessmentsByDateRange(assessments, dateRange)
    setFilteredAssessments(filtered)
    setCurrentPage(1) // Reset to first page when filter changes
  }, [assessments, dateRange])

  // Calculate statistics
  const currentMonthAverage = calculateAverageRating(filteredAssessments)
  const totalAssessments = filteredAssessments.length
  const parameterAverages = calculateParameterAverages(filteredAssessments)
  const bestParameter = getBestParameter(parameterAverages)
  const worstParameter = getWorstParameter(parameterAverages)
  const trendData = getMonthlyTrend(assessments, 6)

  // Pagination
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage)
  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getCurrentMonthYear = () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getTrendIndicator = () => {
    if (trendData.length < 2) return null
    const current = trendData[trendData.length - 1].average
    const previous = trendData[trendData.length - 2].average
    if (current > previous) return { icon: TrendingUp, color: 'text-green-600', text: 'Up' }
    if (current < previous) return { icon: TrendingDown, color: 'text-red-600', text: 'Down' }
    return null
  }

  const trendIndicator = getTrendIndicator()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your performance data..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Menu className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-900">Performance Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <span className="text-sm text-gray-600">{profile?.full_name || user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.full_name || 'Trainer'}! 👋
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{getCurrentMonthYear()}</span>
                </div>
                {lastAssessmentDate && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Last assessment: {formatDate(lastAssessmentDate)}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="input-field min-w-[180px]"
              >
                <option value="current-month">Current Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="year-to-date">Year to Date</option>
                <option value="all-time">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'badges', label: 'Badges', icon: Award },
              { id: 'goals', label: 'Goals', icon: Target },
              { id: 'level', label: 'Level', icon: Star },
              { id: 'streaks', label: 'Streaks', icon: TrendingUp },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Smart Dashboard Summary */}
            <TrainerSmartDashboard />
            
            {/* Assessment History - Show actual assessment details */}
            {assessments.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Assessment History</h3>
                  <span className="text-sm text-gray-600">
                    {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {filteredAssessments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No assessments for selected period</p>
                    <p className="text-sm text-gray-500">
                      Change the date range filter to see assessments.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Assessed By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Overall Score
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedAssessments.map((assessment) => (
                            <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  {formatDate(assessment.assessment_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {assessment.assessor_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`text-lg font-semibold ${getScoreColor(assessment.average_score)}`}>
                                    {assessment.average_score.toFixed(2)}
                                  </span>
                                  <span className="text-gray-500 ml-1">/ 5.00</span>
                                  <div className="ml-3 flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= Math.round(assessment.average_score)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'fill-gray-200 text-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => setSelectedAssessment(assessment)}
                                  className="text-primary-600 hover:text-primary-900 flex items-center gap-1 ml-auto"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Feedback
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Legacy Overview Content - Hidden but kept for reference */}
        {false && activeTab === 'overview' && (
          <>
            {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Month Average */}
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary-500 p-3 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              {trendIndicator && (
                <div className={`flex items-center gap-1 ${trendIndicator.color}`}>
                  <trendIndicator.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{trendIndicator.text}</span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Current Month Average</h3>
            <p className={`text-3xl font-bold ${getScoreColor(currentMonthAverage)}`}>
              {currentMonthAverage > 0 ? currentMonthAverage.toFixed(2) : 'N/A'}
            </p>
            <p className="text-sm text-gray-500 mt-1">/ 5.00</p>
          </div>

          {/* Total Assessments */}
          <div className="card">
            <div className="bg-secondary-500 p-3 rounded-lg mb-4 w-fit">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Assessments ({getDateRangeLabel(dateRange)})
            </h3>
            <p className="text-3xl font-bold text-gray-900">{totalAssessments}</p>
            <p className="text-sm text-gray-500 mt-1">Total received</p>
          </div>

          {/* Best Parameter */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="bg-green-500 p-3 rounded-lg mb-4 w-fit">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Best Performing</h3>
            <p className="text-lg font-semibold text-gray-900 mb-1">{bestParameter.parameter}</p>
            <p className={`text-2xl font-bold ${getScoreColor(bestParameter.average)}`}>
              {bestParameter.average > 0 ? bestParameter.average.toFixed(2) : 'N/A'}
            </p>
          </div>

          {/* Area for Improvement */}
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
            <div className="bg-yellow-500 p-3 rounded-lg mb-4 w-fit">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Focus Area</h3>
            <p className="text-lg font-semibold text-gray-900 mb-1">{worstParameter.parameter}</p>
            <p className={`text-2xl font-bold ${getScoreColor(worstParameter.average)}`}>
              {worstParameter.average > 0 ? worstParameter.average.toFixed(2) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Parameter Breakdown */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance by Parameter</h3>
          <div className="space-y-6">
            {parameterAverages.map((param, index) => {
              const percentage = getProgressPercentage(param.average)
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{param.parameter}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getScoreColor(param.average)}`}>
                        {param.average > 0 ? param.average.toFixed(2) : 'N/A'}
                      </span>
                      <span className="text-gray-500">/ 5.00</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getScoreBgColor(param.average)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Performance Insights */}
        <div className="mb-8">
          <PerformanceInsights trainerId={user?.id || ''} assessments={filteredAssessments} />
        </div>

        {/* Performance Trend Chart */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Trend (Last 6 Months)</h3>
          {trendData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis domain={[0, 5]} stroke="#6b7280" />
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
                  dataKey="average"
                  name="Average Rating"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <p>No trend data available yet</p>
            </div>
          )}
        </div>

        {/* Assessment History */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Assessment History</h3>
            <span className="text-sm text-gray-600">
              Showing {paginatedAssessments.length} of {filteredAssessments.length} assessments
            </span>
          </div>

          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No assessments yet</p>
              <p className="text-sm text-gray-500">
                Your assessment results will appear here once managers complete evaluations.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overall Score
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(assessment.assessment_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assessment.assessor_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-lg font-semibold ${getScoreColor(assessment.average_score)}`}>
                              {assessment.average_score.toFixed(2)}
                            </span>
                            <span className="text-gray-500 ml-1">/ 5.00</span>
                            <div className="ml-3 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= Math.round(assessment.average_score)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'fill-gray-200 text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedAssessment(assessment)}
                            className="text-primary-600 hover:text-primary-900 flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-4 h-4" />
                            View Feedback
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </>
        )}

        {activeTab === 'badges' && <BadgeSystem />}

        {activeTab === 'goals' && <GoalTracking />}

        {activeTab === 'level' && <LevelSystem />}

        {activeTab === 'streaks' && <StreakTracker />}

        {activeTab === 'leaderboard' && <Leaderboard />}
      </main>

      {/* Assessment Feedback Modal */}
      {selectedAssessment && (
        <AssessmentFeedbackModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      {/* Quick Actions (FAB, shortcuts, command palette) */}
      <QuickActions />
    </div>
  )
}

export default TrainerDashboard
