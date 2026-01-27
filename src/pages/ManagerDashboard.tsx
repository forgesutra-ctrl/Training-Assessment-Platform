import { useState, useEffect } from 'react'
import { FileText, Users, Star, Plus, LogOut, Menu, Eye, Calendar } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchManagerAssessments, fetchMonthlyStats } from '@/utils/assessments'
import { AssessmentWithDetails } from '@/types'
import AssessmentDetails from '@/components/AssessmentDetails'
import ManagerSmartDashboard from '@/components/dashboard/ManagerSmartDashboard'
import NotificationDropdown from '@/components/dashboard/NotificationDropdown'
import QuickActions from '@/components/dashboard/QuickActions'
import SoundToggle from '@/components/ui/SoundToggle'
import { checkAlerts, notificationService } from '@/utils/notifications'
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

        // Check for alerts
        const alerts = await checkAlerts(user.id, profile.role)
        
        // Process alerts
        if (alerts && alerts.length > 0) {
          alerts.forEach((alert) => {
            notificationService.addNotification(alert)
          })
        }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
              <h1 className="text-xl font-bold text-gray-900">Manager Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <SoundToggle />
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
        <ManagerSmartDashboard />
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