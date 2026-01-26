import { useState, useEffect } from 'react'
import { FileText, Users, Star, Plus, LogOut, Menu, Eye, Calendar } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchManagerAssessments, fetchMonthlyStats } from '@/utils/assessments'
import { AssessmentWithDetails } from '@/types'
import AssessmentDetails from '@/components/AssessmentDetails'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const ManagerDashboard = () => {
  const { user, profile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithDetails | null>(null)
  const [stats, setStats] = useState({
    totalAssessments: 0,
    trainersAssessed: 0,
    averageRating: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      if (!user || !profile) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [assessmentsData, statsData] = await Promise.all([
          fetchManagerAssessments(user.id, 10),
          fetchMonthlyStats(user.id),
        ])

        setAssessments(assessmentsData)
        setStats(statsData)
      } catch (error: any) {
        console.error('Error loading dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, profile])

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

  const statsCards = [
    {
      title: 'Assessments This Month',
      value: stats.totalAssessments.toString(),
      icon: FileText,
      color: 'bg-primary-500',
      change: null,
    },
    {
      title: 'Trainers Assessed',
      value: stats.trainersAssessed.toString(),
      icon: Users,
      color: 'bg-secondary-500',
      change: null,
    },
    {
      title: 'Average Rating',
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(2) : '0.00',
      icon: Star,
      color: 'bg-yellow-500',
      change: null,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Menu className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-900">Manager Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
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
        {loading ? (
          <div className="space-y-6">
            {/* Loading Skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="card">
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.full_name || 'Manager'}!
              </h2>
              <p className="text-gray-600">Here's an overview of your assessments</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                  </div>
                )
              })}
            </div>

            {/* New Assessment Button */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/manager/assessment/new')}
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
              >
                <Plus className="w-6 h-6" />
                New Assessment
              </button>
            </div>

            {/* Recent Assessments Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
                {assessments.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Showing last {assessments.length} assessments
                  </span>
                )}
              </div>

              {assessments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No assessments yet</p>
                  <button
                    onClick={() => navigate('/manager/assessment/new')}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Assessment
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trainer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Score
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assessments.map((assessment) => (
                        <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {assessment.trainer_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(assessment.assessment_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-lg font-semibold text-primary-600">
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
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Assessment Details Modal */}
      {selectedAssessment && (
        <AssessmentDetails
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  )
}

export default ManagerDashboard
