import { supabase } from '@/lib/supabase'
import { AssessmentWithDetails } from '@/types'

/**
 * Fetch eligible trainers for assessment (not direct reports)
 */
export const fetchEligibleTrainers = async (managerId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      team_id,
      teams(team_name)
    `)
    .eq('role', 'trainer')
    .neq('reporting_manager_id', managerId)
    .order('full_name')

  if (error) throw error
  
  // Format the data
  const formatted = (data || []).map((trainer: any) => {
    const team = Array.isArray(trainer.teams) ? trainer.teams[0] : trainer.teams
    return {
      ...trainer,
      team_name: team?.team_name || 'No Team',
    }
  })
  
  return formatted
}

/**
 * Fetch manager's recent assessments
 */
export const fetchManagerAssessments = async (
  managerId: string,
  limit: number = 10
): Promise<AssessmentWithDetails[]> => {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      trainer:profiles!trainer_id(full_name),
      assessor:profiles!assessor_id(full_name)
    `)
    .eq('assessor_id', managerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  // Calculate average score and format data
  const assessments: AssessmentWithDetails[] = (data || []).map((assessment: any) => {
    const ratings = [
      assessment.trainers_readiness,
      assessment.communication_skills,
      assessment.domain_expertise,
      assessment.knowledge_displayed,
      assessment.people_management,
      assessment.technical_skills,
    ]
    const average = ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length

    return {
      ...assessment,
      trainer_name: assessment.trainer?.full_name || 'Unknown',
      assessor_name: assessment.assessor?.full_name || 'Unknown',
      average_score: average,
    }
  })

  return assessments
}

/**
 * Calculate monthly statistics for a manager
 */
export const fetchMonthlyStats = async (managerId: string) => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('assessor_id', managerId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString())

  if (error) throw error

  const assessments = data || []
  const totalAssessments = assessments.length

  // Get unique trainers assessed
  const uniqueTrainers = new Set(assessments.map((a: any) => a.trainer_id))
  const trainersAssessed = uniqueTrainers.size

  // Calculate average rating
  let totalRating = 0
  let ratingCount = 0
  assessments.forEach((assessment: any) => {
    const ratings = [
      assessment.trainers_readiness,
      assessment.communication_skills,
      assessment.domain_expertise,
      assessment.knowledge_displayed,
      assessment.people_management,
      assessment.technical_skills,
    ]
    ratings.forEach((rating) => {
      totalRating += rating
      ratingCount++
    })
  })

  const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0

  return {
    totalAssessments,
    trainersAssessed,
    averageRating: Number(averageRating.toFixed(2)),
  }
}

/**
 * Fetch a single assessment with details
 */
export const fetchAssessmentDetails = async (
  assessmentId: string
): Promise<AssessmentWithDetails | null> => {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      trainer:profiles!trainer_id(full_name),
      assessor:profiles!assessor_id(full_name)
    `)
    .eq('id', assessmentId)
    .single()

  if (error) throw error
  if (!data) return null

  const ratings = [
    data.trainers_readiness,
    data.communication_skills,
    data.domain_expertise,
    data.knowledge_displayed,
    data.people_management,
    data.technical_skills,
  ]
  const average = ratings.reduce((sum, val) => sum + val, 0) / ratings.length

  return {
    ...data,
    trainer_name: data.trainer?.full_name || 'Unknown',
    assessor_name: data.assessor?.full_name || 'Unknown',
    average_score: average,
  }
}
