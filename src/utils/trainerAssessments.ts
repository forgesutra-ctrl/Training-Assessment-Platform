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

  // Format the data - calculate average from all 21 parameters
  const assessments: TrainerAssessmentWithDetails[] = (data || []).map((assessment: any) => {
    // Get all 21 parameter ratings
    const paramIds = [
      'logs_in_early', 'video_always_on', 'minimal_disturbance', 'presentable_prompt', 'ready_with_tools',
      'adequate_knowledge', 'simplifies_topics', 'encourages_participation', 'handles_questions', 'provides_context',
      'maintains_attention', 'uses_interactive_tools', 'assesses_learning', 'clear_speech',
      'minimal_grammar_errors', 'professional_tone', 'manages_teams_well',
      'efficient_tool_switching', 'audio_video_clarity', 'session_recording', 'survey_assignment',
    ]
    
    const ratings = paramIds
      .map((id) => assessment[id] as number | null)
      .filter((rating): rating is number => rating !== null && rating > 0)
    
    const average = ratings.length > 0
      ? ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length
      : 0

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
