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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerDashboard.tsx:27',message:'loadData called',data:{hasUser:!!user,hasProfile:!!profile,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Don't wait for profile - load data as soon as we have user
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerDashboard.tsx:36',message:'Before Promise.all',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const [assessmentsData, statsData] = await Promise.all([
          fetchManagerAssessments(user.id, 10),
          fetchMonthlyStats(user.id),
        ])
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerDashboard.tsx:41',message:'After Promise.all',data:{assessmentsCount:assessmentsData?.length,hasStats:!!statsData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

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
