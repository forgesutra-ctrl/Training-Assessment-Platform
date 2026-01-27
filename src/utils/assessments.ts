import { supabase } from '@/lib/supabase'
import { AssessmentWithDetails } from '@/types'
import { calculateAssessmentAverage } from '@/utils/trainerStats'

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
  // First, fetch assessments
  const { data: assessmentsData, error: assessmentsError } = await supabase
    .from('assessments')
    .select('*')
    .eq('assessor_id', managerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (assessmentsError) {
    console.error('Error fetching manager assessments:', assessmentsError)
    throw assessmentsError
  }

  if (!assessmentsData || assessmentsData.length === 0) {
    return []
  }

  // Get unique trainer and assessor IDs
  const trainerIds = [...new Set(assessmentsData.map((a: any) => a.trainer_id).filter(Boolean))]
  const assessorIds = [...new Set(assessmentsData.map((a: any) => a.assessor_id).filter(Boolean))]

  // Fetch trainer profiles
  const { data: trainerProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', trainerIds)

  // Fetch assessor profiles
  const { data: assessorProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', assessorIds)

  // Create lookup maps
  const trainerMap = new Map((trainerProfiles || []).map((p: any) => [p.id, p]))
  const assessorMap = new Map((assessorProfiles || []).map((p: any) => [p.id, p]))

  // Calculate average score using 21-parameter system and format data
  const assessments: AssessmentWithDetails[] = assessmentsData.map((assessment: any) => {
    // Use the new 21-parameter calculation
    const average = calculateAssessmentAverage(assessment as AssessmentWithDetails)

    // Get trainer and assessor from maps
    const trainer = trainerMap.get(assessment.trainer_id)
    const assessor = assessorMap.get(assessment.assessor_id)

    return {
      ...assessment,
      trainer_name: trainer?.full_name || trainer?.email || 'Unknown Trainer',
      assessor_name: assessor?.full_name || assessor?.email || 'Unknown Assessor',
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

  // Calculate average rating using 21-parameter system
  let totalRating = 0
  let ratingCount = 0
  assessments.forEach((assessment: any) => {
    const avg = calculateAssessmentAverage(assessment as AssessmentWithDetails)
    if (avg > 0) {
      totalRating += avg
      ratingCount++
    }
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
  // Fetch assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (assessmentError) throw assessmentError
  if (!assessment) return null

  // Fetch trainer and assessor profiles separately
  const [trainerResult, assessorResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('id', assessment.trainer_id).single(),
    supabase.from('profiles').select('id, full_name, email').eq('id', assessment.assessor_id).single(),
  ])

  const trainer = trainerResult.data
  const assessor = assessorResult.data

  // Use 21-parameter calculation
  const average = calculateAssessmentAverage(assessment as AssessmentWithDetails)

  return {
    ...assessment,
    trainer_name: trainer?.full_name || trainer?.email || 'Unknown Trainer',
    assessor_name: assessor?.full_name || assessor?.email || 'Unknown Assessor',
    average_score: average,
  }
}
