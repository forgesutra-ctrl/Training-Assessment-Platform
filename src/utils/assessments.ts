import { supabase } from '@/lib/supabase'
import { AssessmentWithDetails } from '@/types'
import { calculateAssessmentAverage } from '@/utils/trainerStats'

/**
 * Fetch eligible trainers for assessment (not direct reports)
 */
export const fetchEligibleTrainers = async (managerId: string) => {
  // Fetch trainers first
  const { data: trainers, error: trainersError } = await supabase
    .from('profiles')
    .select('id, full_name, team_id')
    .eq('role', 'trainer')
    .neq('reporting_manager_id', managerId)
    .order('full_name')

  if (trainersError) throw trainersError
  
  if (!trainers || trainers.length === 0) {
    return []
  }

  // Fetch teams separately
  const teamIds = [...new Set(trainers.map((t: any) => t.team_id).filter(Boolean))]
  let teamMap = new Map<string, any>()
  
  if (teamIds.length > 0) {
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, team_name')
      .in('id', teamIds)
    
    if (!teamsError && teams) {
      teams.forEach((team: any) => {
        teamMap.set(team.id, team)
      })
    }
  }
  
  // Format the data
  const formatted = trainers.map((trainer: any) => {
    const team = trainer.team_id ? teamMap.get(trainer.team_id) : null
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

  // Fetch trainer profiles (only if we have trainer IDs)
  let trainerProfiles: any[] = []
  if (trainerIds.length > 0) {
    let query = supabase.from('profiles').select('id, full_name, email')
    if (trainerIds.length === 1) {
      const { data, error } = await query.eq('id', trainerIds[0])
      if (error) {
        console.error('Error fetching trainer profiles:', error)
      } else {
        trainerProfiles = data ? [data] : []
      }
    } else {
      const { data, error } = await query.in('id', trainerIds)
      if (error) {
        console.error('Error fetching trainer profiles:', error)
      } else {
        trainerProfiles = data || []
      }
    }
  }

  // Fetch assessor profiles (only if we have assessor IDs)
  let assessorProfiles: any[] = []
  if (assessorIds.length > 0) {
    let query = supabase.from('profiles').select('id, full_name, email')
    if (assessorIds.length === 1) {
      const { data, error } = await query.eq('id', assessorIds[0])
      if (error) {
        console.error('Error fetching assessor profiles:', error)
      } else {
        assessorProfiles = data ? [data] : []
      }
    } else {
      const { data, error } = await query.in('id', assessorIds)
      if (error) {
        console.error('Error fetching assessor profiles:', error)
      } else {
        assessorProfiles = data || []
      }
    }
  }

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
