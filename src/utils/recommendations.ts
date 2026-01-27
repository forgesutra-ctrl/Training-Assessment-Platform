/**
 * Intelligent Recommendations Engine
 * Provides personalized recommendations for each role
 */

import { supabase } from '@/lib/supabase'

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

    const { data: eligibleTrainers } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        team_id,
        teams(team_name)
      `)
      .eq('role', 'trainer')
      .neq('reporting_manager_id', managerId)

    if (eligibleTrainers && eligibleTrainers.length > 0) {
      // Get assessments this month
      const { data: recentAssessments } = await supabase
        .from('assessments')
        .select('trainer_id, assessment_date')
        .eq('assessor_id', managerId)
        .gte('assessment_date', monthStart.toISOString().split('T')[0])

      const assessedTrainerIds = new Set(recentAssessments?.map((a) => a.trainer_id) || [])

      // Find trainers not assessed this month
      const unassessedTrainers = eligibleTrainers.filter(
        (t) => !assessedTrainerIds.has(t.id)
      )

      if (unassessedTrainers.length > 0) {
        recommendations.push({
          id: 'unassessed-trainers',
          type: 'action',
          priority: 'high',
          title: `${unassessedTrainers.length} trainer${unassessedTrainers.length > 1 ? 's' : ''} need assessment this month`,
          description: `You haven't assessed ${unassessedTrainers.map((t) => t.full_name).join(', ')} this month.`,
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

      const overdueTrainers = eligibleTrainers.filter((trainer) => {
        const lastAssessment = lastAssessmentMap.get(trainer.id)
        if (!lastAssessment) return true // Never assessed
        return lastAssessment < thirtyDaysAgo
      })

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
        .slice(0, 5)

      if (suggestedTrainers.length > 0) {
        recommendations.push({
          id: 'suggested-assessments',
          type: 'suggestion',
          priority: 'medium',
          title: 'Suggested trainers to assess this week',
          description: `Consider assessing: ${suggestedTrainers.map((t) => t.full_name).join(', ')}`,
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
 * Get recommendations for trainers
 */
export const getTrainerRecommendations = async (trainerId: string): Promise<Recommendation[]> => {
  const recommendations: Recommendation[] = []

  try {
    // Get trainer's assessments
    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('assessment_date', { ascending: false })
      .limit(10)

    if (assessments && assessments.length > 0) {
      // Calculate parameter averages
      const paramSums: Record<string, number> = {
        trainers_readiness: 0,
        communication_skills: 0,
        domain_expertise: 0,
        knowledge_displayed: 0,
        people_management: 0,
        technical_skills: 0,
      }

      assessments.forEach((a) => {
        Object.keys(paramSums).forEach((param) => {
          paramSums[param] += a[param] || 0
        })
      })

      const paramAverages: Record<string, number> = {}
      Object.keys(paramSums).forEach((param) => {
        paramAverages[param] = paramSums[param] / assessments.length
      })

      // Find lowest parameter
      const lowestParam = Object.entries(paramAverages).reduce((a, b) =>
        a[1] < b[1] ? a : b
      )

      if (lowestParam[1] < 3.5) {
        recommendations.push({
          id: 'focus-area',
          type: 'suggestion',
          priority: 'medium',
          title: `Focus on ${lowestParam[0].replace(/_/g, ' ')}`,
          description: `This is your lowest parameter (${lowestParam[1].toFixed(2)}/5.0). Consider targeted improvement.`,
          actionLabel: 'View Details',
          actionUrl: '/trainer/dashboard',
          metadata: { parameter: lowestParam[0], score: lowestParam[1] },
        })
      }

      // Find highest parameter
      const highestParam = Object.entries(paramAverages).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )

      if (highestParam[1] >= 4.0) {
        recommendations.push({
          id: 'strength',
          type: 'insight',
          priority: 'low',
          title: `Your strength: ${highestParam[0].replace(/_/g, ' ')}`,
          description: `You're excelling in this area with an average of ${highestParam[1].toFixed(2)}/5.0. Keep it up!`,
          metadata: { parameter: highestParam[0], score: highestParam[1] },
        })
      }

      // Compare current month vs last month
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const monthBeforeLast = new Date(now.getFullYear(), now.getMonth() - 2, 1)

      const currentMonthAssessments = assessments.filter(
        (a) => new Date(a.assessment_date) >= currentMonth
      )
      const lastMonthAssessments = assessments.filter(
        (a) => {
          const date = new Date(a.assessment_date)
          return date >= lastMonth && date < currentMonth
        }
      )

      if (currentMonthAssessments.length > 0 && lastMonthAssessments.length > 0) {
        const currentAvg =
          currentMonthAssessments.reduce((sum, a) => {
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
          }, 0) / currentMonthAssessments.length

        const lastAvg =
          lastMonthAssessments.reduce((sum, a) => {
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
          }, 0) / lastMonthAssessments.length

        const change = ((currentAvg - lastAvg) / lastAvg) * 100

        if (change > 5) {
          recommendations.push({
            id: 'improving',
            type: 'insight',
            priority: 'low',
            title: "You're improving!",
            description: `Your average rating increased by ${change.toFixed(1)}% this month. Great progress!`,
            metadata: { change, currentAvg, lastAvg },
          })
        } else if (change < -5) {
          recommendations.push({
            id: 'declining',
            type: 'alert',
            priority: 'medium',
            title: 'Performance trend',
            description: `Your average rating decreased by ${Math.abs(change).toFixed(1)}% this month. Review feedback for improvement areas.`,
            metadata: { change, currentAvg, lastAvg },
          })
        }
      }
    }
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
