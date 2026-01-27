import { supabase } from '@/lib/supabase'
import { AssessmentWithDetails, TrainerAssessmentWithDetails } from '@/types'

/**
 * Fetch all assessments for a trainer
 */
export const fetchTrainerAssessments = async (
  trainerId: string
): Promise<TrainerAssessmentWithDetails[]> => {
  // Fetch assessments first
  const { data: assessmentsData, error: assessmentsError } = await supabase
    .from('assessments')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('assessment_date', { ascending: false })

  if (assessmentsError) throw assessmentsError

  if (!assessmentsData || assessmentsData.length === 0) {
    return []
  }

  // Get unique assessor IDs
  const assessorIds = [...new Set(assessmentsData.map((a: any) => a.assessor_id).filter(Boolean))]
  
  // Fetch assessor profiles separately
  let assessorMap = new Map<string, any>()
  if (assessorIds.length > 0) {
    const { data: assessors, error: assessorsError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', assessorIds)
    
    if (!assessorsError && assessors) {
      assessors.forEach((assessor: any) => {
        assessorMap.set(assessor.id, assessor)
      })
    }
  }

  // Import calculateAssessmentAverage for 21-parameter calculation
  const { calculateAssessmentAverage } = await import('@/utils/trainerStats')

  // Format the data - calculate average from all 21 parameters
  const assessments: TrainerAssessmentWithDetails[] = assessmentsData.map((assessment: any) => {
    const average = calculateAssessmentAverage(assessment as any)
    const assessor = assessorMap.get(assessment.assessor_id)

    return {
      ...assessment,
      assessor_name: assessor?.full_name || 'Unknown',
      assessor_id: assessor?.id || assessment.assessor_id || '',
      average_score: Number(average.toFixed(2)),
    }
  })

  return assessments
}

/**
 * Fetch trainer's current month statistics
 */
export const fetchTrainerCurrentMonthStats = async (trainerId: string) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('trainer_id', trainerId)
    .gte('assessment_date', monthStart.toISOString().split('T')[0])
    .lte('assessment_date', monthEnd.toISOString().split('T')[0])

  if (error) throw error

  return data || []
}

/**
 * Get last assessment date for a trainer
 */
export const getLastAssessmentDate = async (trainerId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('assessments')
    .select('assessment_date')
    .eq('trainer_id', trainerId)
    .order('assessment_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw error
  }

  return data?.assessment_date || null
}
