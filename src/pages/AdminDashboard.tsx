import { useState, useEffect } from 'react'
import { Users, FileText, Star, TrendingUp, LogOut, Menu, X, BarChart3, Activity, Clock, UserCog, FileText as FileTextIcon, Brain, AlertTriangle, LayoutDashboard, GitCompare, FileText as ReportIcon, BarChart2, Sliders, ChevronRight, Settings, Shield } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import AssessorAssesseeMapping from '@/components/admin/AssessorAssesseeMapping'
import AdminSmartDashboard from '@/components/dashboard/AdminSmartDashboard'
import NotificationDropdown from '@/components/dashboard/NotificationDropdown'
import QuickActions from '@/components/dashboard/QuickActions'
import SmartSearch from '@/components/SmartSearch'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'trainer-performance' | 'manager-activity' | 'time-analysis' | 'user-management' | 'assessor-assessee-mapping' | 'audit-log' | 'predictive-analytics' | 'trend-alerts' | 'data-studio' | 'comparative-analysis' | 'report-templates' | 'correlation-analysis' | 'scenario-modeling'

const VALID_TABS: Tab[] = ['overview', 'trainer-performance', 'manager-activity', 'time-analysis', 'user-management', 'assessor-assessee-mapping', 'audit-log', 'predictive-analytics', 'trend-alerts', 'data-studio', 'comparative-analysis', 'report-templates', 'correlation-analysis', 'scenario-modeling']

interface TabGroup {
  title: string
  icon: any
  tabs: Array<{ id: Tab; label: string; icon: any }>
}

const AdminDashboard = () => {
  const { user, profile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get tab from URL query parameter, default to 'overview'
  const tabFromUrl = searchParams.get('tab') as Tab | null
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview'
  
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats>({
    totalTrainers: 0,
    totalAssessmentsThisMonth: 0,
    platformAverageRating: 0,
    assessmentActivityRate: 0,
  })

  // Sync activeTab with URL query parameter on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as Tab | null
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams, activeTab])

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

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

  const tabGroups: TabGroup[] = [
    {
      title: 'Overview',
      icon: BarChart3,
      tabs: [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
      ],
    },
    {
      title: 'Analytics',
      icon: TrendingUp,
      tabs: [
        { id: 'trainer-performance', label: 'Trainer Performance', icon: Users },
        { id: 'manager-activity', label: 'Manager Activity', icon: Activity },
        { id: 'time-analysis', label: 'Time Analysis', icon: Clock },
        { id: 'data-studio', label: 'Data Studio', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Advanced Analytics',
      icon: Brain,
      tabs: [
        { id: 'predictive-analytics', label: 'Predictive Analytics', icon: Brain },
        { id: 'comparative-analysis', label: 'Comparative Analysis', icon: GitCompare },
        { id: 'correlation-analysis', label: 'Correlation Analysis', icon: BarChart2 },
        { id: 'scenario-modeling', label: 'Scenario Modeling', icon: Sliders },
        { id: 'trend-alerts', label: 'Trend Alerts', icon: AlertTriangle },
      ],
    },
    {
      title: 'Management',
      icon: Settings,
      tabs: [
        { id: 'user-management', label: 'User Management', icon: UserCog },
        { id: 'assessor-assessee-mapping', label: 'Assessor–Assessee Mapping', icon: Shield },
        { id: 'report-templates', label: 'Report Templates', icon: ReportIcon },
        { id: 'audit-log', label: 'Audit Log', icon: Shield },
      ],
    },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const allTabs = tabGroups.flatMap(group => group.tabs)
  const currentTab = allTabs.find(tab => tab.id === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {(profile?.full_name || user?.email || 'A')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">{profile?.full_name || user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-64 flex-shrink-0 bg-white border-r border-gray-200 shadow-xl lg:shadow-none
            transform transition-transform duration-300 ease-in-out
            pt-16 lg:pt-0
            overflow-y-auto
            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <div className="p-4 space-y-6 pb-8">
            {tabGroups.map((group, groupIndex) => {
              const GroupIcon = group.icon
              return (
                <div key={groupIndex} className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <GroupIcon className="w-4 h-4" />
                    <span>{group.title}</span>
                  </div>
                  <div className="space-y-1">
                    {group.tabs.map((tab) => {
                      const TabIcon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            handleTabChange(tab.id)
                            if (window.innerWidth < 1024) setSidebarOpen(false)
                          }}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                            ${
                              isActive
                                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-200'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                            }
                          `}
                        >
                          <TabIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                          <span className="font-medium text-sm">{tab.label}</span>
                          {isActive && <ChevronRight className="w-4 h-4 ml-auto text-white" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome, {profile?.full_name || 'Administrator'}! 👋
                  </h2>
                  <p className="text-gray-600">Comprehensive analytics and system management</p>
                </div>
                {currentTab && (
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-100">
                    {(() => {
                      const Icon = currentTab.icon
                      return <Icon className="w-5 h-5 text-primary-600" />
                    })()}
                    <span className="text-sm font-semibold text-primary-700">{currentTab.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Metrics */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Trainers */}
                <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl shadow-lg shadow-primary-200">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Trainers</h3>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalTrainers}</p>
                    <p className="text-xs text-gray-500">Active trainers</p>
                  </div>
                </div>

                {/* Assessments This Month */}
                <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/5 to-secondary-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 p-3 rounded-xl shadow-lg shadow-secondary-200">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Assessments This Month</h3>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalAssessmentsThisMonth}</p>
                    <p className="text-xs text-gray-500">Current month</p>
                  </div>
                </div>

                {/* Platform Average */}
                <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-200">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Platform Average</h3>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-4xl font-bold ${getScoreColor(stats.platformAverageRating)}`}>
                        {stats.platformAverageRating > 0 ? stats.platformAverageRating.toFixed(2) : 'N/A'}
                      </p>
                      <p className="text-lg text-gray-400">/ 5.00</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Overall rating</p>
                  </div>
                </div>

                {/* Activity Rate */}
                <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-purple-200">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Activity Rate</h3>
                    <p className="text-4xl font-bold text-gray-900 mb-1">
                      {stats.assessmentActivityRate.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">per trainer</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content - Use key prop to force remount and ensure fresh data */}
            <div className="transition-all duration-300" key={activeTab}>
              {activeTab === 'overview' && <AdminSmartDashboard key="overview" />}
              {activeTab === 'trainer-performance' && <TrainerPerformance key="trainer-performance" />}
              {activeTab === 'manager-activity' && <ManagerActivity key="manager-activity" />}
              {activeTab === 'time-analysis' && <TimeAnalysis key="time-analysis" />}
              {activeTab === 'user-management' && <UserManagement key="user-management" />}
              {activeTab === 'assessor-assessee-mapping' && <AssessorAssesseeMapping key="assessor-assessee-mapping" />}
              {activeTab === 'predictive-analytics' && <PredictiveAnalytics key="predictive-analytics" />}
              {activeTab === 'trend-alerts' && <TrendAlerts key="trend-alerts" />}
              {activeTab === 'data-studio' && <DataStudio key="data-studio" />}
              {activeTab === 'comparative-analysis' && <ComparativeAnalysis key="comparative-analysis" />}
              {activeTab === 'correlation-analysis' && <CorrelationAnalysis key="correlation-analysis" />}
              {activeTab === 'scenario-modeling' && <ScenarioModeling key="scenario-modeling" />}
              {activeTab === 'report-templates' && <ReportTemplates key="report-templates" />}
              {activeTab === 'audit-log' && <AuditLog key="audit-log" />}
            </div>
          </div>
        </main>
      </div>

      {/* Quick Actions (FAB, shortcuts, command palette) */}
      <QuickActions />
    </div>
  )
}

export default AdminDashboard
