import { useState, useEffect, useCallback } from 'react'
import { Calendar, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getManagerRecommendations, Recommendation } from '@/utils/recommendations'
import { fetchEligibleTrainers } from '@/utils/assessments'
import { supabase } from '@/lib/supabase'
import ActionRequiredWidget from './ActionRequiredWidget'
import ActivityFeed from './ActivityFeed'
import DataRefresh from './DataRefresh'
import LoadingSpinner from '../LoadingSpinner'
import toast from 'react-hot-toast'

interface TrainerToAssess {
  id: string
  name: string
  team: string
  daysSinceLastAssessment: number | null
  lastAssessmentDate: string | null
}

interface ManagerSmartDashboardProps {
  onViewAssessment?: (assessment: any) => void
}

const ManagerSmartDashboard = ({ onViewAssessment }: ManagerSmartDashboardProps = {}) => {
  const { user, profile } = useAuthContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [suggestedTrainers, setSuggestedTrainers] = useState<TrainerToAssess[]>([])
  const [myTeamReportees, setMyTeamReportees] = useState<{ id: string; full_name: string }[]>([])
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([])

  const loadSuggestedTrainers = useCallback(async () => {
    if (!user) {
      console.warn('Cannot load suggested trainers: user is undefined')
      setSuggestedTrainers([])
      return
    }
    try {
      const eligibleTrainers = await fetchEligibleTrainers(user.id)
      if (!eligibleTrainers || eligibleTrainers.length === 0) {
        setSuggestedTrainers([])
        return
      }

      // Get last assessment dates
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('trainer_id, assessment_date')
        .eq('assessor_id', user.id)
        .order('assessment_date', { ascending: false })

      if (assessmentsError) {
        console.error('Error fetching assessments:', assessmentsError)
      }

      const lastAssessmentMap = new Map<string, { date: string; days: number }>()
      assessments?.forEach((a: any) => {
        const existing = lastAssessmentMap.get(a.trainer_id)
        const assessmentDate = new Date(a.assessment_date)
        const daysSince = Math.floor(
          (Date.now() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (!existing || assessmentDate > new Date(existing.date)) {
          lastAssessmentMap.set(a.trainer_id, {
            date: a.assessment_date,
            days: daysSince,
          })
        }
      })

      const suggested = eligibleTrainers
        .map((trainer: any) => {
          const lastAssessment = lastAssessmentMap.get(trainer.id)
          return {
            id: trainer.id,
            name: trainer.full_name,
            team: trainer.team_name ?? 'No Team',
            daysSinceLastAssessment: lastAssessment?.days ?? null,
            lastAssessmentDate: lastAssessment?.date ?? null,
          }
        })
        .sort((a, b) => {
          // Prioritize trainers not assessed or assessed long ago
          if (a.daysSinceLastAssessment === null) return -1
          if (b.daysSinceLastAssessment === null) return 1
          return b.daysSinceLastAssessment - a.daysSinceLastAssessment
        })
        .slice(0, 5)

      setSuggestedTrainers(suggested)
    } catch (error) {
      console.error('Error loading suggested trainers:', error)
      setSuggestedTrainers([])
    }
  }, [user])

  // Load direct reportees (your team) and their recent assessments
  const loadReporteesRecentPerformance = useCallback(async () => {
    if (!user) {
      setMyTeamReportees([])
      setUpcomingAssessments([])
      return
    }
    try {
      // Direct reportees: trainers who report to this manager (same as Reporting Structure)
      const { data: reportees, error: reporteesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'trainer')
        .eq('reporting_manager_id', user.id)
        .order('full_name')

      if (reporteesError) {
        setMyTeamReportees([])
        setUpcomingAssessments([])
        return
      }

      const reporteeList = reportees ?? []
      setMyTeamReportees(reporteeList.map((r: any) => ({ id: r.id, full_name: r.full_name })))

      if (reporteeList.length === 0) {
        setUpcomingAssessments([])
        return
      }

      const reporteeIds = reporteeList.map((r: any) => r.id)
      const reporteeMap = new Map(reporteeList.map((r: any) => [r.id, r]))

      // Recent assessments of these reportees (by any assessor)
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id, assessment_date, trainer_id')
        .in('trainer_id', reporteeIds)
        .order('assessment_date', { ascending: false })
        .limit(100)

      // One row per reportee: each trainer appears once with their latest assessment (or none)
      const latestByTrainer = new Map<string, any>()
      if (!assessmentsError && assessments && assessments.length > 0) {
        for (const a of assessments) {
          if (!latestByTrainer.has(a.trainer_id)) latestByTrainer.set(a.trainer_id, a)
        }
      }
      const list = reporteeList.map((r: any) => {
        const latest = latestByTrainer.get(r.id)
        return {
          id: latest?.id ?? null,
          assessment_date: latest?.assessment_date ?? null,
          trainer_id: r.id,
          trainer: { full_name: r.full_name },
        }
      })
      setUpcomingAssessments(list)
    } catch (error) {
      console.error('Error loading reportees performance:', error)
      setMyTeamReportees([])
      setUpcomingAssessments([])
    }
  }, [user])

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      console.warn('Cannot load dashboard data: user is undefined')
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const recs = await getManagerRecommendations(user.id)
      setRecommendations(recs)
      await loadSuggestedTrainers()
      await loadReporteesRecentPerformance()
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user, loadSuggestedTrainers, loadReporteesRecentPerformance])

  useEffect(() => {
    if (user) {
      loadDashboardData().catch((error) => console.error('Error in loadDashboardData:', error))
    } else {
      setLoading(false)
    }
  }, [user, profile, loadDashboardData])

  // Guard against missing user during render
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Loading user data...</p>
          <LoadingSpinner size="md" />
        </div>
      </div>
    )
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
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name || user.email || 'Manager'}!</h2>
          <p className="text-sm text-gray-600 mt-1">Here's what needs your attention today</p>
        </div>
        <DataRefresh onRefresh={() => loadDashboardData().catch(console.error)} />
      </div>

      {/* Action Required Widget */}
      <ActionRequiredWidget recommendations={recommendations} userRole="manager" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggested Trainers to Assess — only trainers aligned for this manager (cross-team; not reportees) */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Suggested Trainers to Assess This Week</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Only trainers you can assess under the crossover rule (other teams; not your direct reportees).
          </p>
          {suggestedTrainers.length === 0 ? (
            <p className="text-sm text-gray-500">No trainers aligned for you to assess at this time.</p>
          ) : (
            <div className="space-y-3">
              {suggestedTrainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{trainer.name}</p>
                      <p className="text-sm text-gray-600">{trainer.team}</p>
                      {trainer.lastAssessmentDate ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Last assessed {trainer.daysSinceLastAssessment} days ago
                        </p>
                      ) : (
                        <p className="text-xs text-orange-600 mt-1">Never assessed</p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/manager/assessment/new', { state: { preselectedTrainerId: trainer.id } })}
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Assess Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Team Performance — direct reportees only (assessments done by others on your team) */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Team Performance</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Your direct reportees — recent assessments of your team (completed by other assessors).
          </p>
          {/* Always show your team (direct reportees) so it matches Reporting Structure */}
          {myTeamReportees.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Your team ({myTeamReportees.length})</p>
              <div className="flex flex-wrap gap-2">
                {myTeamReportees.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-800 border border-primary-200"
                  >
                    {r.full_name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {myTeamReportees.length === 0 && (
            <p className="text-sm text-amber-600 mb-4">No direct reportees assigned. Update reporting manager in Admin if needed.</p>
          )}
          <div className="space-y-3">
            {upcomingAssessments.length === 0 ? (
              <p className="text-sm text-gray-500">No direct reportees to show.</p>
            ) : (
              upcomingAssessments.map((row: any) => {
                const trainer = row.trainer
                const hasAssessment = row.id != null && row.assessment_date != null
                return (
                  <div
                    key={row.trainer_id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {trainer?.full_name || 'Unknown Trainer'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {hasAssessment
                            ? new Date(row.assessment_date).toLocaleDateString()
                            : 'No recent assessment'}
                        </p>
                      </div>
                      {hasAssessment ? (
                        <button
                          onClick={async () => {
                            if (onViewAssessment) {
                              try {
                                const { fetchAssessmentDetails } = await import('@/utils/assessments')
                                const fullAssessment = await fetchAssessmentDetails(row.id)
                                if (fullAssessment) onViewAssessment(fullAssessment)
                              } catch (error) {
                                console.error('Error fetching assessment details:', error)
                                toast.error('Failed to load assessment details')
                              }
                            } else {
                              navigate('/manager/dashboard')
                            }
                          }}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          View
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed limit={5} showFilters={false} />

      {/* Calendar Integration Placeholder */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Assessment Schedule</h3>
        </div>
        <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Calendar integration coming soon</p>
          <p className="text-sm text-gray-500">
            View and manage your assessment schedule in one place
          </p>
        </div>
      </div>
    </div>
  )
}

export default ManagerSmartDashboard
