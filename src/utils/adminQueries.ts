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

  // Platform average rating
  const { data: allAssessments } = await supabase.from('assessments').select('*')

  let platformAverage = 0
  if (allAssessments && allAssessments.length > 0) {
    const totalRating = allAssessments.reduce((sum, a) => {
      const avg =
        (a.trainers_readiness +
          a.communication_skills +
          a.domain_expertise +
          a.knowledge_displayed +
          a.people_management +
          a.technical_skills) /
        6
      return sum + avg
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
  dateRange: 'month' | 'quarter' | 'ytd' | 'all-time' = 'all-time'
): Promise<TrainerWithStats[]> => {
  const now = new Date()
  let startDate: Date

  switch (dateRange) {
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
    case 'all-time':
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
  const managerIds = trainers?.map((t) => t.reporting_manager_id).filter(Boolean) || []
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', managerIds)

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
        return (
          sum +
          (a.trainers_readiness +
            a.communication_skills +
            a.domain_expertise +
            a.knowledge_displayed +
            a.people_management +
            a.technical_skills) /
            6
        )
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

    // Calculate average rating given
    const avgRating =
      managerAssessments.length > 0
        ? Number(
            (
              managerAssessments.reduce((sum, a) => {
                return (
                  sum +
                  (a.trainers_readiness +
                    a.communication_skills +
                    a.domain_expertise +
                    a.knowledge_displayed +
                    a.people_management +
                    a.technical_skills) /
                    6
                )
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
        parameter_averages: {
          trainers_readiness: 0,
          communication_skills: 0,
          domain_expertise: 0,
          knowledge_displayed: 0,
          people_management: 0,
          technical_skills: 0,
        },
      })
      continue
    }

    const totalRating = assessments.reduce((sum, a) => {
      return (
        sum +
        (a.trainers_readiness +
          a.communication_skills +
          a.domain_expertise +
          a.knowledge_displayed +
          a.people_management +
          a.technical_skills) /
          6
      )
    }, 0)

    const average_rating = Number((totalRating / assessments.length).toFixed(2))
    const uniqueTrainers = new Set(assessments.map((a) => a.trainer_id)).size

    // Parameter averages
    const paramSums = {
      trainers_readiness: 0,
      communication_skills: 0,
      domain_expertise: 0,
      knowledge_displayed: 0,
      people_management: 0,
      technical_skills: 0,
    }

    assessments.forEach((a) => {
      paramSums.trainers_readiness += a.trainers_readiness
      paramSums.communication_skills += a.communication_skills
      paramSums.domain_expertise += a.domain_expertise
      paramSums.knowledge_displayed += a.knowledge_displayed
      paramSums.people_management += a.people_management
      paramSums.technical_skills += a.technical_skills
    })

    const count = assessments.length
    trends.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      average_rating,
      assessment_count: assessments.length,
      trainers_assessed: uniqueTrainers,
      parameter_averages: {
        trainers_readiness: Number((paramSums.trainers_readiness / count).toFixed(2)),
        communication_skills: Number((paramSums.communication_skills / count).toFixed(2)),
        domain_expertise: Number((paramSums.domain_expertise / count).toFixed(2)),
        knowledge_displayed: Number((paramSums.knowledge_displayed / count).toFixed(2)),
        people_management: Number((paramSums.people_management / count).toFixed(2)),
        technical_skills: Number((paramSums.technical_skills / count).toFixed(2)),
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
        return (
          sum +
          (a.trainers_readiness +
            a.communication_skills +
            a.domain_expertise +
            a.knowledge_displayed +
            a.people_management +
            a.technical_skills) /
            6
        )
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
  
  // Fetch trainer profiles with teams
  const trainerIds = [...new Set(assessments?.map((a: any) => a.trainer_id) || [])]
  const { data: trainerProfiles } = await supabase
    .from('profiles')
    .select('id, team_id, teams(team_name)')
    .in('id', trainerIds)

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
    .select('id, assessor_id, trainer_id, assessment_date, created_at, trainers_readiness, communication_skills, domain_expertise, knowledge_displayed, people_management, technical_skills')
    .order('created_at', { ascending: false })
    .limit(limit)

  // Fetch assessor and trainer names
  const assessorIds = [...new Set(data?.map((a: any) => a.assessor_id) || [])]
  const trainerIds = [...new Set(data?.map((a: any) => a.trainer_id) || [])]
  
  const { data: assessors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', assessorIds)
  
  const { data: trainers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', trainerIds)

  if (error) throw error

  return (data || []).map((a: any) => {
    const avg =
      (a.trainers_readiness +
        a.communication_skills +
        a.domain_expertise +
        a.knowledge_displayed +
        a.people_management +
        a.technical_skills) /
      6

    const assessor = assessors?.find((p: any) => p.id === a.assessor_id)
    const trainer = trainers?.find((p: any) => p.id === a.trainer_id)

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
      .select('trainer_id, assessment_date, trainers_readiness, communication_skills, domain_expertise, knowledge_displayed, people_management, technical_skills')
      .gte('assessment_date', startDate.toISOString().split('T')[0])

    // Fetch trainer profiles separately
    const trainerIds = [...new Set(assessments?.map((a: any) => a.trainer_id) || [])]
    const { data: trainerProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, team_id, teams(team_name)')
      .in('id', trainerIds)

  if (!assessments) return []

  // Group by trainer and calculate averages
  const trainerMap = new Map<string, { scores: number[]; count: number; name: string; team: string | null }>()

  assessments?.forEach((a: any) => {
    const trainerId = a.trainer_id
    const avg =
      (a.trainers_readiness +
        a.communication_skills +
        a.domain_expertise +
        a.knowledge_displayed +
        a.people_management +
        a.technical_skills) /
      6

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
