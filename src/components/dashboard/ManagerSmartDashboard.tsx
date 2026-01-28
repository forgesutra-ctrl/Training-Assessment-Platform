import { useState, useEffect, useCallback } from 'react'
import { Calendar, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getManagerRecommendations, Recommendation } from '@/utils/recommendations'
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
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([])

  const loadSuggestedTrainers = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:74',message:'loadSuggestedTrainers called',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (!user) {
      console.warn('Cannot load suggested trainers: user is undefined')
      setSuggestedTrainers([])
      return
    }
    try {
      // Fetch trainers first
      const { data: eligibleTrainers, error: trainersError } = await supabase
        .from('profiles')
        .select('id, full_name, team_id')
        .eq('role', 'trainer')
        .neq('reporting_manager_id', user.id)

      if (trainersError) {
        console.error('Error fetching eligible trainers:', trainersError)
        return
      }

      if (!eligibleTrainers || eligibleTrainers.length === 0) {
        setSuggestedTrainers([])
        return
      }

      // Fetch teams separately
      const teamIds = [...new Set(eligibleTrainers.map((t: any) => t.team_id).filter(Boolean))]
      let teamMap = new Map<string, any>()
      
      if (teamIds.length > 0) {
        let query = supabase.from('teams').select('id, team_name')
        const { data: teams, error: teamsError } = teamIds.length === 1
          ? await query.eq('id', teamIds[0])
          : await query.in('id', teamIds)
        
        if (!teamsError && teams) {
          const teamsArray = Array.isArray(teams) ? teams : [teams]
          teamsArray.forEach((team: any) => {
            teamMap.set(team.id, team)
          })
        }
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
          const team = trainer.team_id ? teamMap.get(trainer.team_id) : null
          const lastAssessment = lastAssessmentMap.get(trainer.id)
          return {
            id: trainer.id,
            name: trainer.full_name,
            team: team?.team_name || 'No Team',
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

  const loadUpcomingAssessments = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:164',message:'loadUpcomingAssessments called',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (!user) {
      console.warn('Cannot load upcoming assessments: user is undefined')
      setUpcomingAssessments([])
      return
    }
    // This would integrate with a calendar system
    // For now, show recent assessments
    try {
      // Fetch assessments first
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id, assessment_date, trainer_id')
        .eq('assessor_id', user.id)
        .order('assessment_date', { ascending: false })
        .limit(5)

      if (assessmentsError) {
        console.error('Error fetching assessments:', assessmentsError)
        setUpcomingAssessments([])
        return
      }

      if (!assessments || assessments.length === 0) {
        setUpcomingAssessments([])
        return
      }

      // Fetch trainer profiles separately
      const trainerIds = [...new Set(assessments.map((a: any) => a.trainer_id).filter(Boolean))]
      let trainerMap = new Map<string, any>()
      
      if (trainerIds.length > 0) {
        let query = supabase.from('profiles').select('id, full_name')
        const { data: trainers, error: trainersError } = trainerIds.length === 1
          ? await query.eq('id', trainerIds[0])
          : await query.in('id', trainerIds)
        
        if (!trainersError && trainers) {
          const trainersArray = Array.isArray(trainers) ? trainers : [trainers]
          trainersArray.forEach((trainer: any) => {
            trainerMap.set(trainer.id, trainer)
          })
        }
      }

      // Combine assessments with trainer data
      const assessmentsWithTrainers = assessments.map((assessment: any) => {
        const trainer = trainerMap.get(assessment.trainer_id)
        return {
          ...assessment,
          trainer: trainer ? { full_name: trainer.full_name } : null,
        }
      })

      setUpcomingAssessments(assessmentsWithTrainers)
    } catch (error) {
      console.error('Error loading upcoming assessments:', error)
      setUpcomingAssessments([])
    }
  }, [user])

  const loadDashboardData = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:45',message:'loadDashboardData called',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (!user) {
      console.warn('Cannot load dashboard data: user is undefined')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:55',message:'Before getManagerRecommendations',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      // Load recommendations
      const recs = await getManagerRecommendations(user.id)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:59',message:'After getManagerRecommendations',data:{recsCount:recs?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      setRecommendations(recs)

      // Load suggested trainers
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:65',message:'Before loadSuggestedTrainers',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      await loadSuggestedTrainers()

      // Load upcoming assessments (calendar)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:70',message:'Before loadUpcomingAssessments',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      await loadUpcomingAssessments()
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:48',message:'Error loading dashboard',data:{errorName:error?.name,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user, loadSuggestedTrainers, loadUpcomingAssessments])

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:33',message:'useEffect triggered',data:{hasUser:!!user,hasProfile:!!profile,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    // Don't wait for profile - load data as soon as we have user
    if (user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:38',message:'About to call loadDashboardData',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      loadDashboardData().catch((error) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:42',message:'loadDashboardData promise rejected',data:{errorName:error?.name,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.error('Error in loadDashboardData:', error)
      })
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ac6e3676-a7af-4765-923d-9db43db4bf92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManagerSmartDashboard.tsx:42',message:'No user, setting loading to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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
        <DataRefresh onRefresh={() => loadDashboardData().catch(console.error)} autoRefreshInterval={30} />
      </div>

      {/* Action Required Widget */}
      <ActionRequiredWidget recommendations={recommendations} userRole="manager" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggested Trainers to Assess */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Suggested Trainers to Assess This Week</h3>
          </div>
          {suggestedTrainers.length === 0 ? (
            <p className="text-sm text-gray-500">No trainers to suggest at this time.</p>
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
                      onClick={() => navigate('/manager/assessment/new')}
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

        {/* Recent Team Performance Snapshot */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Team Performance</h3>
          </div>
          <div className="space-y-3">
            {upcomingAssessments.length === 0 ? (
              <p className="text-sm text-gray-500">No recent assessments to display.</p>
            ) : (
              upcomingAssessments.map((assessment: any) => {
                const trainer = assessment.trainer
                return (
                  <div
                    key={assessment.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {trainer?.full_name || 'Unknown Trainer'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(assessment.assessment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (onViewAssessment) {
                            // Fetch full assessment details
                            try {
                              const { fetchAssessmentDetails } = await import('@/utils/assessments')
                              const fullAssessment = await fetchAssessmentDetails(assessment.id)
                              if (fullAssessment) {
                                onViewAssessment(fullAssessment)
                              }
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
