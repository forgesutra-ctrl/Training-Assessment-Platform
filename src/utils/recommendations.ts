/**
 * Intelligent Recommendations Engine
 * Provides personalized recommendations for each role
 */

import { supabase } from '@/lib/supabase'
import { getEligibleTrainerIdsForAssessor } from '@/utils/assessorAssesseeEligibility'
import { calculateParameterAverages } from '@/utils/trainerStats'
import { generateLearningRecommendations } from '@/utils/aiService'

export interface Recommendation {
  id: string
  type: 'action' | 'insight' | 'alert' | 'suggestion'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionLabel?: string
  actionUrl?: string
  metadata?: Record<string, any>
}

/**
 * Get recommendations for managers
 */
export const getManagerRecommendations = async (managerId: string): Promise<Recommendation[]> => {
  const recommendations: Recommendation[] = []

  try {
    // Get trainers that haven't been assessed this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Eligible trainers: rule-based + admin overrides (no self, no reportees)
    const eligibleIds = await getEligibleTrainerIdsForAssessor(managerId)
    if (eligibleIds.length === 0) {
      return recommendations
    }

    const { data: trainersData } = await supabase
      .from('profiles')
      .select('id, full_name, team_id')
      .in('id', eligibleIds)
    const eligibleTrainers = trainersData || []

    if (eligibleTrainers.length > 0) {
      const teamIds = [...new Set(eligibleTrainers.map((t: any) => t.team_id).filter(Boolean))]
      let teamMap = new Map<string, any>()
      if (teamIds.length > 0) {
        const query = supabase.from('teams').select('id, team_name')
        const { data: teams } = teamIds.length === 1
          ? await query.eq('id', teamIds[0])
          : await query.in('id', teamIds)
        if (teams) {
          const teamsArray = Array.isArray(teams) ? teams : [teams]
          teamsArray.forEach((team: any) => {
            teamMap.set(team.id, team)
          })
        }
      }

      // Get assessments this month
      const { data: recentAssessments } = await supabase
        .from('assessments')
        .select('trainer_id, assessment_date')
        .eq('assessor_id', managerId)
        .gte('assessment_date', monthStart.toISOString().split('T')[0])

      const assessedTrainerIds = new Set(recentAssessments?.map((a) => a.trainer_id) || [])

      // Find trainers not assessed this month (with team names)
      const unassessedTrainers = eligibleTrainers
        .filter((t) => !assessedTrainerIds.has(t.id))
        .map((t: any) => ({
          ...t,
          team_name: t.team_id ? teamMap.get(t.team_id)?.team_name : null,
        }))

      if (unassessedTrainers.length > 0) {
        recommendations.push({
          id: 'unassessed-trainers',
          type: 'action',
          priority: 'high',
          title: `${unassessedTrainers.length} trainer${unassessedTrainers.length > 1 ? 's' : ''} need assessment this month`,
          description: `You haven't assessed ${unassessedTrainers.map((t: any) => t.full_name).join(', ')} this month.`,
          actionLabel: 'Assess Now',
          actionUrl: '/manager/assessment/new',
          metadata: { trainers: unassessedTrainers },
        })
      }

      // Find trainers with overdue assessments (more than 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const { data: allAssessments } = await supabase
        .from('assessments')
        .select('trainer_id, assessment_date')
        .eq('assessor_id', managerId)
        .order('assessment_date', { ascending: false })

      const lastAssessmentMap = new Map<string, Date>()
      allAssessments?.forEach((a) => {
        const lastDate = lastAssessmentMap.get(a.trainer_id)
        const currentDate = new Date(a.assessment_date)
        if (!lastDate || currentDate > lastDate) {
          lastAssessmentMap.set(a.trainer_id, currentDate)
        }
      })

      const overdueTrainers = eligibleTrainers
        .filter((trainer) => {
          const lastAssessment = lastAssessmentMap.get(trainer.id)
          if (!lastAssessment) return true // Never assessed
          return lastAssessment < thirtyDaysAgo
        })
        .map((t: any) => ({
          ...t,
          team_name: t.team_id ? teamMap.get(t.team_id)?.team_name : null,
        }))

      if (overdueTrainers.length > 0) {
        recommendations.push({
          id: 'overdue-assessments',
          type: 'alert',
          priority: 'high',
          title: `${overdueTrainers.length} overdue assessment${overdueTrainers.length > 1 ? 's' : ''}`,
          description: `These trainers haven't been assessed in over 30 days: ${overdueTrainers
            .slice(0, 3)
            .map((t) => t.full_name)
            .join(', ')}${overdueTrainers.length > 3 ? '...' : ''}`,
          actionLabel: 'View All',
          actionUrl: '/manager/dashboard',
          metadata: { trainers: overdueTrainers },
        })
      }

      // Suggest trainers to assess this week (based on last assessment date)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const suggestedTrainers = eligibleTrainers
        .filter((trainer) => {
          const lastAssessment = lastAssessmentMap.get(trainer.id)
          if (!lastAssessment) return true
          return lastAssessment < sevenDaysAgo
        })
        .map((t: any) => ({
          ...t,
          team_name: t.team_id ? teamMap.get(t.team_id)?.team_name : null,
        }))
        .slice(0, 5)

      if (suggestedTrainers.length > 0) {
        recommendations.push({
          id: 'suggested-assessments',
          type: 'suggestion',
          priority: 'medium',
          title: 'Suggested trainers to assess this week',
          description: `Consider assessing: ${suggestedTrainers.map((t: any) => t.full_name).join(', ')}`,
          actionLabel: 'Start Assessment',
          actionUrl: '/manager/assessment/new',
          metadata: { trainers: suggestedTrainers },
        })
      }
    }
  } catch (error) {
    console.error('Error generating manager recommendations:', error)
  }

  return recommendations
}

/**
 * Get recommendations for trainers (AI-driven from weakest areas + assessment overall comments)
 */
export const getTrainerRecommendations = async (trainerId: string): Promise<Recommendation[]> => {
  const recommendations: Recommendation[] = []

  try {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('assessment_date', { ascending: false })
      .limit(20)

    if (!assessments || assessments.length === 0) {
      return recommendations
    }

    // 21-parameter schema: identify weakest areas (lowest average parameters)
    const parameterAverages = calculateParameterAverages(assessments as any[])
    const sortedByWorst = [...parameterAverages]
      .filter((p) => p.average > 0)
      .sort((a, b) => a.average - b.average)

    const weakestAreas = sortedByWorst
      .slice(0, 4)
      .filter((p) => p.average < 4.5)
      .map((p) => p.parameter)

    // Extract overall comments from assessments (for AI context)
    const overallComments = assessments
      .map((a: any) => a.overall_comments)
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)

    // First recommendation: least performed area(s)
    if (weakestAreas.length > 0) {
      const areaLabel = weakestAreas.join(', ')
      const worst = sortedByWorst[0]
      const detail = worst ? ` — lowest: ${worst.parameter} at ${worst.average.toFixed(2)}/5` : ''
      recommendations.push({
        id: 'least-performed-areas',
        type: 'insight',
        priority: 'high',
        title: 'Least performed area(s)',
        description: `${areaLabel}${detail}. Focus development here.`,
        actionLabel: 'View Details',
        actionUrl: '/trainer/dashboard',
        metadata: { weakestAreas, parameterAverages: sortedByWorst.slice(0, 5) },
      })
    }

    // AI-driven learning recommendations (uses weakest areas + overall comments)
    const aiItems = await generateLearningRecommendations(weakestAreas, overallComments)
    aiItems.forEach((item, index) => {
      recommendations.push({
        id: `ai-learning-${index}`,
        type: 'suggestion',
        priority: 'medium',
        title: item.title,
        description: item.description,
        metadata: { source: 'ai' },
      })
    })
  } catch (error) {
    console.error('Error generating trainer recommendations:', error)
  }

  return recommendations
}

/**
 * Get recommendations for admins
 */
export const getAdminRecommendations = async (): Promise<Recommendation[]> => {
  const recommendations: Recommendation[] = []

  try {
    // Get all trainers
    const { data: trainers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'trainer')

    // Get all assessments
    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .order('assessment_date', { ascending: false })
      .limit(100)

    if (assessments && assessments.length > 0) {
      // Find trainers with declining performance
      const trainerScores: Record<string, number[]> = {}
      assessments.forEach((a) => {
        if (!trainerScores[a.trainer_id]) {
          trainerScores[a.trainer_id] = []
        }
        const avg =
          (a.trainers_readiness +
            a.communication_skills +
            a.domain_expertise +
            a.knowledge_displayed +
            a.people_management +
            a.technical_skills) /
          6
        trainerScores[a.trainer_id].push(avg)
      })

      const decliningTrainers: Array<{ id: string; name: string; trend: number }> = []
      Object.entries(trainerScores).forEach(([trainerId, scores]) => {
        if (scores.length >= 3) {
          const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3
          const older = scores.slice(3, 6).reduce((a, b) => a + b, 0) / (scores.length - 3)
          if (recent < older - 0.3) {
            const trainer = trainers?.find((t) => t.id === trainerId)
            if (trainer) {
              decliningTrainers.push({
                id: trainerId,
                name: trainer.full_name,
                trend: ((recent - older) / older) * 100,
              })
            }
          }
        }
      })

      if (decliningTrainers.length > 0) {
        recommendations.push({
          id: 'declining-trainers',
          type: 'alert',
          priority: 'high',
          title: `${decliningTrainers.length} trainer${decliningTrainers.length > 1 ? 's' : ''} showing declining performance`,
          description: `${decliningTrainers.map((t) => t.name).join(', ')} need attention.`,
          actionLabel: 'View Details',
          actionUrl: '/admin/dashboard?tab=trainer-performance',
          metadata: { trainers: decliningTrainers },
        })
      }
    }

    // Check for inactive managers
    const { data: managers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'manager')

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (managers && assessments) {
      const managerActivity: Record<string, Date> = {}
      assessments.forEach((a) => {
        const date = new Date(a.assessment_date)
        const existing = managerActivity[a.assessor_id]
        if (!existing || date > existing) {
          managerActivity[a.assessor_id] = date
        }
      })

      const inactiveManagers = managers.filter((m) => {
        const lastActivity = managerActivity[m.id]
        return !lastActivity || lastActivity < thirtyDaysAgo
      })

      if (inactiveManagers.length > 0) {
        recommendations.push({
          id: 'inactive-managers',
          type: 'alert',
          priority: 'medium',
          title: `${inactiveManagers.length} inactive manager${inactiveManagers.length > 1 ? 's' : ''}`,
          description: `These managers haven't assessed anyone in 30+ days: ${inactiveManagers
            .map((m) => m.full_name)
            .join(', ')}`,
          actionLabel: 'View Activity',
          actionUrl: '/admin/dashboard?tab=manager-activity',
          metadata: { managers: inactiveManagers },
        })
      }
    }
  } catch (error) {
    console.error('Error generating admin recommendations:', error)
  }

  return recommendations
}
