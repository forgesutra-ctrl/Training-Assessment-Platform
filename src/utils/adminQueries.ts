import { supabase } from '@/lib/supabase'
import {
  PlatformStats,
  TrainerWithStats,
  ManagerActivity,
  MonthlyTrend,
  QuarterlyData,
  CrossAssessmentMatrix,
  HeatmapData,
  RecentActivity,
  TopPerformer,
} from '@/types'
import { calculateAssessmentAverage } from '@/utils/trainerStats'

/**
 * Fetch platform-wide statistics
 */
export const fetchPlatformStats = async (): Promise<PlatformStats> => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Total trainers
  const { count: totalTrainers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'trainer')

  // Assessments this month
  const { count: totalAssessmentsThisMonth } = await supabase
    .from('assessments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthStart.toISOString())

  // Platform average rating (using all 21 parameters)
  const { data: allAssessments } = await supabase.from('assessments').select('*')

  let platformAverage = 0
  if (allAssessments && allAssessments.length > 0) {
    const totalRating = allAssessments.reduce((sum, a) => {
      return sum + calculateAssessmentAverage(a as any)
    }, 0)
    platformAverage = Number((totalRating / allAssessments.length).toFixed(2))
  }

  // Activity rate (assessments per trainer this month)
  const activityRate =
    totalTrainers && totalTrainers > 0 && totalAssessmentsThisMonth !== null
      ? Number((totalAssessmentsThisMonth / totalTrainers).toFixed(2))
      : 0

  return {
    totalTrainers: totalTrainers || 0,
    totalAssessmentsThisMonth: totalAssessmentsThisMonth || 0,
    platformAverageRating: platformAverage,
    assessmentActivityRate: activityRate,
  }
}

/**
 * Fetch all trainers with comprehensive statistics
 */
export const fetchAllTrainersWithStats = async (
  dateRange: 'month' | 'quarter' | 'ytd' | 'all-time' | 'last-12-months' | 'last-6-months' = 'all-time'
): Promise<TrainerWithStats[]> => {
  const now = new Date()
  let startDate: Date

  switch (dateRange) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    }
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case 'last-12-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
      break
    case 'last-6-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      break
    case 'all-time':
    default:
      startDate = new Date(0) // Beginning of time
      break
  }

  // Fetch all trainers with their teams and managers
  const { data: trainers } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      team_id,
      reporting_manager_id,
      teams(team_name)
    `)
    .eq('role', 'trainer')

  // Fetch reporting managers separately
  const managerIds = [...new Set(trainers?.map((t) => t.reporting_manager_id).filter(Boolean) || [])]
  let managers: any[] = []
  if (managerIds.length > 0) {
    let query = supabase.from('profiles').select('id, full_name')
    const { data: managersData } = managerIds.length === 1
      ? await query.eq('id', managerIds[0])
      : await query.in('id', managerIds)
    managers = Array.isArray(managersData) ? managersData : (managersData ? [managersData] : [])
  }

  if (!trainers) return []

  // Fetch all assessments
  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .gte('assessment_date', startDate.toISOString().split('T')[0])

  const trainerStats: TrainerWithStats[] = []

  for (const trainer of trainers) {
    const trainerAssessments = assessments?.filter((a) => a.trainer_id === trainer.id) || []

    const calculateAverage = (assessments: any[]) => {
      if (assessments.length === 0) return 0
      const total = assessments.reduce((sum, a) => {
        return sum + calculateAssessmentAverage(a)
      }, 0)
      return Number((total / assessments.length).toFixed(2))
    }

    // Current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthAssessments = trainerAssessments.filter(
      (a) => new Date(a.assessment_date + 'T00:00:00') >= monthStart
    )
    const current_month_avg = calculateAverage(monthAssessments)

    // Quarter
    const quarter = Math.floor(now.getMonth() / 3)
    const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
    const quarterAssessments = trainerAssessments.filter(
      (a) => new Date(a.assessment_date + 'T00:00:00') >= quarterStart
    )
    const quarter_avg = calculateAverage(quarterAssessments)

    // YTD
    const ytdStart = new Date(now.getFullYear(), 0, 1)
    const ytdAssessments = trainerAssessments.filter(
      (a) => new Date(a.assessment_date + 'T00:00:00') >= ytdStart
    )
    const ytd_avg = calculateAverage(ytdAssessments)

    // All time
    const all_time_avg = calculateAverage(trainerAssessments)

    // Trend (compare current month to previous month)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const prevMonthAssessments = trainerAssessments.filter(
      (a) => {
        const assessmentDate = new Date(a.assessment_date + 'T00:00:00')
        return assessmentDate >= prevMonthStart && assessmentDate <= prevMonthEnd
      }
    )
    const prev_month_avg = calculateAverage(prevMonthAssessments)

    let trend: 'up' | 'down' | 'stable' = 'stable'
    let trend_percentage = 0
    if (prev_month_avg > 0) {
      const change = current_month_avg - prev_month_avg
      trend_percentage = Number(((change / prev_month_avg) * 100).toFixed(1))
      if (change > 0.1) trend = 'up'
      else if (change < -0.1) trend = 'down'
    }

    const manager = managers?.find((m) => m.id === trainer.reporting_manager_id)
    
    trainerStats.push({
      id: trainer.id,
      full_name: trainer.full_name,
      team_name: Array.isArray(trainer.teams) ? trainer.teams[0]?.team_name : (trainer.teams as any)?.team_name || null,
      reporting_manager_name: manager?.full_name || null,
      current_month_avg,
      quarter_avg,
      ytd_avg,
      all_time_avg,
      total_assessments: trainerAssessments.length,
      trend,
      trend_percentage,
    })
  }

  return trainerStats
}

/**
 * Fetch manager activity statistics
 */
export const fetchManagerActivity = async (): Promise<ManagerActivity[]> => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const quarter = Math.floor(now.getMonth() / 3)
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Fetch all managers
  const { data: managers } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      team_id,
      teams(team_name)
    `)
    .eq('role', 'manager')

  if (!managers) return []

  // Fetch all assessments
  const { data: assessments } = await supabase.from('assessments').select('*')

  const managerStats: ManagerActivity[] = []

  for (const manager of managers) {
    const managerAssessments = assessments?.filter((a) => a.assessor_id === manager.id) || []

    const monthAssessments = managerAssessments.filter(
      (a) => new Date(a.created_at) >= monthStart
    )
    const quarterAssessments = managerAssessments.filter(
      (a) => new Date(a.created_at) >= quarterStart
    )
    const yearAssessments = managerAssessments.filter(
      (a) => new Date(a.created_at) >= yearStart
    )

    // Calculate average rating given (using all 21 parameters)
    const avgRating =
      managerAssessments.length > 0
        ? Number(
            (
              managerAssessments.reduce((sum, a) => {
                return sum + calculateAssessmentAverage(a)
              }, 0) / managerAssessments.length
            ).toFixed(2)
          )
        : 0

    // Unique trainers assessed
    const uniqueTrainers = new Set(managerAssessments.map((a) => a.trainer_id)).size

    // Last assessment date
    const sortedAssessments = [...managerAssessments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastAssessmentDate = sortedAssessments[0]?.created_at || null

    // Activity status
    const activity_status =
      lastAssessmentDate && new Date(lastAssessmentDate) >= thirtyDaysAgo ? 'active' : 'inactive'

    managerStats.push({
      id: manager.id,
      full_name: manager.full_name,
      team_name: (manager.teams as any)?.team_name || null,
      assessments_this_month: monthAssessments.length,
      assessments_this_quarter: quarterAssessments.length,
      assessments_this_year: yearAssessments.length,
      all_time_total: managerAssessments.length,
      avg_rating_given: avgRating,
      unique_trainers_assessed: uniqueTrainers,
      last_assessment_date: lastAssessmentDate,
      activity_status,
    })
  }

  return managerStats
}

/**
 * Fetch monthly trends
 */
export const fetchMonthlyTrends = async (months: number = 12): Promise<MonthlyTrend[]> => {
  const now = new Date()
  const trends: MonthlyTrend[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .gte('assessment_date', monthStart.toISOString().split('T')[0])
      .lte('assessment_date', monthEnd.toISOString().split('T')[0])

    if (!assessments || assessments.length === 0) {
      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        average_rating: 0,
        assessment_count: 0,
        trainers_assessed: 0,
        category_averages: {
          trainer_readiness: 0,
          expertise_delivery: 0,
          engagement_interaction: 0,
          communication: 0,
          technical_acumen: 0,
        },
      })
      continue
    }

    const totalRating = assessments.reduce((sum, a) => {
      return sum + calculateAssessmentAverage(a as any)
    }, 0)

    const average_rating = Number((totalRating / assessments.length).toFixed(2))
    const uniqueTrainers = new Set(assessments.map((a) => a.trainer_id)).size

    // Calculate category averages
    const categorySums: Record<string, { sum: number; count: number }> = {
      trainer_readiness: { sum: 0, count: 0 },
      expertise_delivery: { sum: 0, count: 0 },
      engagement_interaction: { sum: 0, count: 0 },
      communication: { sum: 0, count: 0 },
      technical_acumen: { sum: 0, count: 0 },
    }

    assessments.forEach((a: any) => {
      // Category 1: Trainer Initial Readiness (5 parameters)
      const readinessParams = ['logs_in_early', 'video_always_on', 'minimal_disturbance', 'presentable_prompt', 'ready_with_tools']
      readinessParams.forEach((param) => {
        const val = a[param]
        if (val && val > 0) {
          categorySums.trainer_readiness.sum += val
          categorySums.trainer_readiness.count++
        }
      })

      // Category 2: Trainer Expertise & Delivery (5 parameters)
      const expertiseParams = ['adequate_knowledge', 'simplifies_topics', 'encourages_participation', 'handles_questions', 'provides_context']
      expertiseParams.forEach((param) => {
        const val = a[param]
        if (val && val > 0) {
          categorySums.expertise_delivery.sum += val
          categorySums.expertise_delivery.count++
        }
      })

      // Category 3: Participant Engagement & Interaction (4 parameters)
      const engagementParams = ['maintains_attention', 'uses_interactive_tools', 'assesses_learning', 'clear_speech']
      engagementParams.forEach((param) => {
        const val = a[param]
        if (val && val > 0) {
          categorySums.engagement_interaction.sum += val
          categorySums.engagement_interaction.count++
        }
      })

      // Category 4: Communication Skills (3 parameters)
      const communicationParams = ['minimal_grammar_errors', 'professional_tone', 'manages_teams_well']
      communicationParams.forEach((param) => {
        const val = a[param]
        if (val && val > 0) {
          categorySums.communication.sum += val
          categorySums.communication.count++
        }
      })

      // Category 5: Technical Acumen (4 parameters)
      const technicalParams = ['efficient_tool_switching', 'audio_video_clarity', 'session_recording', 'survey_assignment']
      technicalParams.forEach((param) => {
        const val = a[param]
        if (val && val > 0) {
          categorySums.technical_acumen.sum += val
          categorySums.technical_acumen.count++
        }
      })
    })

    const count = assessments.length
    trends.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      average_rating,
      assessment_count: assessments.length,
      trainers_assessed: uniqueTrainers,
      category_averages: {
        trainer_readiness: categorySums.trainer_readiness.count > 0
          ? Number((categorySums.trainer_readiness.sum / categorySums.trainer_readiness.count).toFixed(2))
          : 0,
        expertise_delivery: categorySums.expertise_delivery.count > 0
          ? Number((categorySums.expertise_delivery.sum / categorySums.expertise_delivery.count).toFixed(2))
          : 0,
        engagement_interaction: categorySums.engagement_interaction.count > 0
          ? Number((categorySums.engagement_interaction.sum / categorySums.engagement_interaction.count).toFixed(2))
          : 0,
        communication: categorySums.communication.count > 0
          ? Number((categorySums.communication.sum / categorySums.communication.count).toFixed(2))
          : 0,
        technical_acumen: categorySums.technical_acumen.count > 0
          ? Number((categorySums.technical_acumen.sum / categorySums.technical_acumen.count).toFixed(2))
          : 0,
      },
    })
  }

  return trends
}

/**
 * Fetch quarterly data
 */
export const fetchQuarterlyData = async (): Promise<QuarterlyData[]> => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const quarters: QuarterlyData[] = []

  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let q = 1; q <= 4; q++) {
      const quarterStart = new Date(year, (q - 1) * 3, 1)
      const quarterEnd = new Date(year, q * 3, 0)

      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .gte('assessment_date', quarterStart.toISOString().split('T')[0])
        .lte('assessment_date', quarterEnd.toISOString().split('T')[0])

      if (!assessments || assessments.length === 0) {
        quarters.push({
          quarter: `Q${q} ${year}`,
          average_rating: 0,
          assessment_count: 0,
          year,
        })
        continue
      }

      const totalRating = assessments.reduce((sum, a) => {
        return sum + calculateAssessmentAverage(a as any)
      }, 0)

      quarters.push({
        quarter: `Q${q} ${year}`,
        average_rating: Number((totalRating / assessments.length).toFixed(2)),
        assessment_count: assessments.length,
        year,
      })
    }
  }

  return quarters
}

/**
 * Fetch cross-assessment matrix
 */
export const getCrossAssessmentMatrix = async (): Promise<CrossAssessmentMatrix[]> => {
  // Fetch all managers
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'manager')

  if (!managers) return []

  // Fetch all assessments
  const { data: assessments } = await supabase.from('assessments').select('assessor_id, trainer_id')
  
  // Fetch trainer profiles separately
  const trainerIds = [...new Set(assessments?.map((a: any) => a.trainer_id).filter(Boolean) || [])]
  let trainerProfiles: any[] = []
  let teamMap = new Map<string, any>()
  
  if (trainerIds.length > 0) {
    let query = supabase.from('profiles').select('id, team_id')
    const { data: trainersData } = trainerIds.length === 1
      ? await query.eq('id', trainerIds[0])
      : await query.in('id', trainerIds)
    
    trainerProfiles = Array.isArray(trainersData) ? trainersData : (trainersData ? [trainersData] : [])
    
    // Fetch teams separately
    const teamIds = [...new Set(trainerProfiles.map((t: any) => t.team_id).filter(Boolean))]
    if (teamIds.length > 0) {
      let teamQuery = supabase.from('teams').select('id, team_name')
      const { data: teamsData } = teamIds.length === 1
        ? await teamQuery.eq('id', teamIds[0])
        : await teamQuery.in('id', teamIds)
      
      const teamsArray = Array.isArray(teamsData) ? teamsData : (teamsData ? [teamsData] : [])
      teamsArray.forEach((team: any) => {
        teamMap.set(team.id, team)
      })
    }
    
    // Add team_name to trainer profiles
    trainerProfiles = trainerProfiles.map((t: any) => ({
      ...t,
      team_name: t.team_id ? teamMap.get(t.team_id)?.team_name : null,
    }))
  }

  // Get all unique teams
  const { data: teams } = await supabase.from('teams').select('id, team_name')

  const matrix: CrossAssessmentMatrix[] = []

  for (const manager of managers) {
    const managerAssessments = assessments?.filter((a: any) => a.assessor_id === manager.id) || []
    const teamAssessments: Record<string, number> = {}

    teams?.forEach((team: any) => {
      const count = managerAssessments.filter((a: any) => {
        const trainerProfile = trainerProfiles?.find((p: any) => p.id === a.trainer_id)
        const trainerTeamId = trainerProfile?.team_id
        return trainerTeamId === team.id
      }).length
      teamAssessments[team.team_name] = count
    })

    matrix.push({
      manager_id: manager.id,
      manager_name: manager.full_name,
      team_assessments: teamAssessments,
    })
  }

  return matrix
}

/**
 * Fetch assessment activity heatmap data
 */
export const getAssessmentActivityHeatmap = async (): Promise<HeatmapData[]> => {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)

  const { data: assessments } = await supabase
    .from('assessments')
    .select('assessment_date')
    .gte('assessment_date', startDate.toISOString().split('T')[0])

  if (!assessments) return []

  // Group by date
  const dateMap = new Map<string, number>()
  assessments.forEach((a) => {
    const date = a.assessment_date
    dateMap.set(date, (dateMap.get(date) || 0) + 1)
  })

  return Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))
}

/**
 * Fetch recent activity
 */
export const fetchRecentActivity = async (limit: number = 20): Promise<RecentActivity[]> => {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  // Fetch assessor and trainer names
  const assessorIds = [...new Set(data?.map((a: any) => a.assessor_id).filter(Boolean) || [])]
  const trainerIds = [...new Set(data?.map((a: any) => a.trainer_id).filter(Boolean) || [])]
  
  let assessorMap = new Map<string, any>()
  let trainerMap = new Map<string, any>()

  if (assessorIds.length > 0) {
    let query = supabase.from('profiles').select('id, full_name')
    const { data: assessors, error: assessorsError } = assessorIds.length === 1
      ? await query.eq('id', assessorIds[0])
      : await query.in('id', assessorIds)
    
    if (!assessorsError && assessors) {
      const assessorsArray = Array.isArray(assessors) ? assessors : [assessors]
      assessorsArray.forEach((assessor: any) => {
        assessorMap.set(assessor.id, assessor)
      })
    }
  }
  
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

  if (error) throw error

  return (data || []).map((a: any) => {
    const avg = calculateAssessmentAverage(a)

    const assessor = assessorMap.get(a.assessor_id)
    const trainer = trainerMap.get(a.trainer_id)

    return {
      id: a.id,
      assessor_name: assessor?.full_name || 'Unknown',
      trainer_name: trainer?.full_name || 'Unknown',
      assessment_date: a.assessment_date,
      average_score: Number(avg.toFixed(2)),
      created_at: a.created_at,
    }
  })
}

/**
 * Fetch top performers
 */
export const getTopPerformers = async (
  limit: number = 5,
  period: 'month' | 'quarter' | 'ytd' = 'month'
): Promise<TopPerformer[]> => {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
  }

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .gte('assessment_date', startDate.toISOString().split('T')[0])

    // Fetch trainer profiles separately
    const trainerIds = [...new Set(assessments?.map((a: any) => a.trainer_id).filter(Boolean) || [])]
    let trainerProfiles: any[] = []
    let teamMap = new Map<string, any>()
    
    if (trainerIds.length > 0) {
      let query = supabase.from('profiles').select('id, full_name, team_id')
      const { data: trainersData } = trainerIds.length === 1
        ? await query.eq('id', trainerIds[0])
        : await query.in('id', trainerIds)
      
      trainerProfiles = Array.isArray(trainersData) ? trainersData : (trainersData ? [trainersData] : [])
      
      // Fetch teams separately
      const teamIds = [...new Set(trainerProfiles.map((t: any) => t.team_id).filter(Boolean))]
      if (teamIds.length > 0) {
        let teamQuery = supabase.from('teams').select('id, team_name')
        const { data: teamsData } = teamIds.length === 1
          ? await teamQuery.eq('id', teamIds[0])
          : await teamQuery.in('id', teamIds)
        
        const teamsArray = Array.isArray(teamsData) ? teamsData : (teamsData ? [teamsData] : [])
        teamsArray.forEach((team: any) => {
          teamMap.set(team.id, team)
        })
      }
      
      // Add team_name to trainer profiles
      trainerProfiles = trainerProfiles.map((t: any) => ({
        ...t,
        team_name: t.team_id ? teamMap.get(t.team_id)?.team_name : null,
      }))
    }

  if (!assessments) return []

  // Group by trainer and calculate averages
  const trainerMap = new Map<string, { scores: number[]; count: number; name: string; team: string | null }>()

  assessments?.forEach((a: any) => {
    const trainerId = a.trainer_id
    const avg = calculateAssessmentAverage(a)

    if (!trainerMap.has(trainerId)) {
      const trainerProfile = trainerProfiles?.find((p: any) => p.id === trainerId)
      const team = Array.isArray(trainerProfile?.teams) 
        ? trainerProfile.teams[0]?.team_name 
        : (trainerProfile?.teams as any)?.team_name || null
      
      trainerMap.set(trainerId, {
        scores: [],
        count: 0,
        name: trainerProfile?.full_name || 'Unknown',
        team: team,
      })
    }

    const trainer = trainerMap.get(trainerId)!
    trainer.scores.push(avg)
    trainer.count++
  })

  // Calculate averages and sort
  const performers: TopPerformer[] = Array.from(trainerMap.entries())
    .map(([trainer_id, data]) => ({
      trainer_id,
      trainer_name: data.name,
      team_name: data.team,
      average_rating: Number((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(2)),
      assessment_count: data.count,
    }))
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, limit)

  return performers
}
