import { useState, useEffect } from 'react'
import { FileText, Users, Star, Plus, LogOut, Menu, Eye, Calendar, User } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchManagerAssessments, fetchMonthlyStats } from '@/utils/assessments'
import { AssessmentWithDetails } from '@/types'
import AssessmentDetails from '@/components/AssessmentDetails'
import ManagerSmartDashboard from '@/components/dashboard/ManagerSmartDashboard'
import NotificationDropdown from '@/components/dashboard/NotificationDropdown'
import QuickActions from '@/components/dashboard/QuickActions'
import { checkAlerts } from '@/utils/notifications'
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
      // Don't wait for profile - load data as soon as we have user
      if (!user) {
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

        // Check for alerts only if profile is available (non-blocking)
        if (profile) {
          try {
            const alerts = await checkAlerts(user.id, profile.role)
            const { notificationService } = await import('@/utils/notifications')
            for (const alert of alerts) {
              notificationService.addNotification(alert)
            }
          } catch (alertError) {
            // Non-critical - don't block dashboard
            console.warn('Error loading alerts:', alertError)
          }
        }
      } catch (error: any) {
        console.error('Error loading dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Dashboard load timeout - stopping loading state')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    loadData()

    return () => clearTimeout(timeoutId)
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
        <ManagerSmartDashboard onViewAssessment={setSelectedAssessment} />
        
        {/* Assessments List Section */}
        <div className="mt-8 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-600" />
              Recent Assessments
            </h2>
            <button
              onClick={() => navigate('/manager/assessment/new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Assessment
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" text="Loading assessments..." />
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No assessments yet</p>
              <p className="text-sm text-gray-400 mb-4">Start by creating your first assessment</p>
              <button
                onClick={() => navigate('/manager/assessment/new')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Assessment
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {assessment.trainer_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            {formatDate(assessment.assessment_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {assessment.average_score.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedAssessment(assessment)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
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
      </main>

      {/* Assessment Details Modal */}
      {selectedAssessment && (
        <AssessmentDetails
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      {/* Quick Actions (FAB, shortcuts, command palette) */}
      <QuickActions />
    </div>
  )
}

export default ManagerDashboard
