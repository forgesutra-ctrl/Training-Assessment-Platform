import { useState, useEffect } from 'react'
import { Users, FileText, Star, TrendingUp, LogOut, Menu, BarChart3, Activity, Clock, UserCog, FileText as FileTextIcon, Brain, AlertTriangle, LayoutDashboard, GitCompare, FileText as ReportIcon, BarChart2, Sliders } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchPlatformStats } from '@/utils/adminQueries'
import { PlatformStats } from '@/types'
import OverviewTab from '@/components/admin/OverviewTab'
import TrainerPerformance from '@/components/admin/TrainerPerformance'
import ManagerActivity from '@/components/admin/ManagerActivity'
import TimeAnalysis from '@/components/admin/TimeAnalysis'
import UserManagement from '@/components/admin/UserManagement'
import AuditLog from '@/components/admin/AuditLog'
import PredictiveAnalytics from '@/components/admin/PredictiveAnalytics'
import TrendAlerts from '@/components/admin/TrendAlerts'
import DataStudio from '@/components/admin/DataStudio'
import ComparativeAnalysis from '@/components/admin/ComparativeAnalysis'
import ReportTemplates from '@/components/admin/ReportTemplates'
import CorrelationAnalysis from '@/components/admin/CorrelationAnalysis'
import ScenarioModeling from '@/components/admin/ScenarioModeling'
import SmartSearch from '@/components/SmartSearch'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'trainer-performance' | 'manager-activity' | 'time-analysis' | 'user-management' | 'audit-log' | 'predictive-analytics' | 'trend-alerts' | 'data-studio' | 'comparative-analysis' | 'report-templates' | 'correlation-analysis' | 'scenario-modeling'

const AdminDashboard = () => {
  const { user, profile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats>({
    totalTrainers: 0,
    totalAssessmentsThisMonth: 0,
    platformAverageRating: 0,
    assessmentActivityRate: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const platformStats = await fetchPlatformStats()
        setStats(platformStats)
      } catch (error: any) {
        console.error('Error loading platform stats:', error)
        toast.error('Failed to load platform statistics')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'trainer-performance' as Tab, label: 'Trainer Performance', icon: Users },
    { id: 'manager-activity' as Tab, label: 'Manager Activity', icon: Activity },
    { id: 'time-analysis' as Tab, label: 'Time-based Analysis', icon: Clock },
    { id: 'user-management' as Tab, label: 'User Management', icon: UserCog },
    { id: 'predictive-analytics' as Tab, label: 'Predictive Analytics', icon: Brain },
    { id: 'trend-alerts' as Tab, label: 'Trend Alerts', icon: AlertTriangle },
    { id: 'data-studio' as Tab, label: 'Data Studio', icon: LayoutDashboard },
    { id: 'comparative-analysis' as Tab, label: 'Comparative Analysis', icon: GitCompare },
    { id: 'correlation-analysis' as Tab, label: 'Correlation Analysis', icon: BarChart2 },
    { id: 'scenario-modeling' as Tab, label: 'Scenario Modeling', icon: Sliders },
    { id: 'report-templates' as Tab, label: 'Report Templates', icon: ReportIcon },
    { id: 'audit-log' as Tab, label: 'Audit Log', icon: FileTextIcon },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Menu className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {profile?.full_name || 'Administrator'}! 👋
          </h2>
          <p className="text-gray-600">Comprehensive analytics and system management</p>
        </div>

        {/* Top Metrics */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card">
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Trainers */}
            <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary-500 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Trainers</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTrainers}</p>
            </div>

            {/* Assessments This Month */}
            <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100 border-2 border-secondary-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-secondary-500 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Assessments This Month</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAssessmentsThisMonth}</p>
            </div>

            {/* Platform Average */}
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Platform Average Rating</h3>
              <p className={`text-3xl font-bold ${getScoreColor(stats.platformAverageRating)}`}>
                {stats.platformAverageRating > 0 ? stats.platformAverageRating.toFixed(2) : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">/ 5.00</p>
            </div>

            {/* Activity Rate */}
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Activity Rate</h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.assessmentActivityRate.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">assessments per trainer</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="card mb-6 p-0">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'trainer-performance' && <TrainerPerformance />}
          {activeTab === 'manager-activity' && <ManagerActivity />}
          {activeTab === 'time-analysis' && <TimeAnalysis />}
          {activeTab === 'user-management' && <UserManagement />}
          {activeTab === 'predictive-analytics' && <PredictiveAnalytics />}
          {activeTab === 'trend-alerts' && <TrendAlerts />}
          {activeTab === 'data-studio' && <DataStudio />}
          {activeTab === 'comparative-analysis' && <ComparativeAnalysis />}
          {activeTab === 'correlation-analysis' && <CorrelationAnalysis />}
          {activeTab === 'scenario-modeling' && <ScenarioModeling />}
          {activeTab === 'report-templates' && <ReportTemplates />}
          {activeTab === 'audit-log' && <AuditLog />}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
