import { supabase } from '@/lib/supabase'
import { AssessmentWithDetails, TrainerAssessmentWithDetails } from '@/types'

/**
 * Fetch all assessments for a trainer
 */
export const fetchTrainerAssessments = async (
  trainerId: string
): Promise<TrainerAssessmentWithDetails[]> => {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      assessor:profiles!assessor_id(full_name, id)
    `)
    .eq('trainer_id', trainerId)
    .order('assessment_date', { ascending: false })

  if (error) throw error

  // Format the data
  const assessments: TrainerAssessmentWithDetails[] = (data || []).map((assessment: any) => {
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
      assessor_name: assessment.assessor?.full_name || 'Unknown',
      assessor_id: assessment.assessor?.id || '',
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
