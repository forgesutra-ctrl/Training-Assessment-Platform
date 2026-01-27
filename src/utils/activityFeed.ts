/**
 * Real-time Activity Feed
 * Tracks and displays platform activity
 */

import { supabase } from '@/lib/supabase'

export interface ActivityItem {
  id: string
  type: 'assessment_created' | 'assessment_updated' | 'user_created' | 'user_updated' | 'goal_achieved' | 'badge_earned'
  actor: {
    id: string
    name: string
    role: string
  }
  target?: {
    id: string
    name: string
    type: string
  }
  metadata?: Record<string, any>
  timestamp: Date
  message: string
}

/**
 * Fetch recent activity
 */
export const fetchRecentActivity = async (limit: number = 20): Promise<ActivityItem[]> => {
  const activities: ActivityItem[] = []

  try {
    // Fetch recent assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('id, assessment_date, assessor_id, trainer_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (assessmentsError) {
      console.error('Error fetching assessments for activity feed:', assessmentsError)
      return activities
    }

    if (!assessments || assessments.length === 0) {
      return activities
    }

    // Get unique assessor and trainer IDs
    const assessorIds = [...new Set(assessments.map((a: any) => a.assessor_id).filter(Boolean))]
    const trainerIds = [...new Set(assessments.map((a: any) => a.trainer_id).filter(Boolean))]

    // Fetch profiles separately
    let assessorMap = new Map<string, any>()
    let trainerMap = new Map<string, any>()

    if (assessorIds.length > 0) {
      const { data: assessors, error: assessorsError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', assessorIds)
      
      if (!assessorsError && assessors) {
        assessors.forEach((assessor: any) => {
          assessorMap.set(assessor.id, assessor)
        })
      }
    }

    if (trainerIds.length > 0) {
      const { data: trainers, error: trainersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', trainerIds)
      
      if (!trainersError && trainers) {
        trainers.forEach((trainer: any) => {
          trainerMap.set(trainer.id, trainer)
        })
      }
    }

    // Import calculateAssessmentAverage for 21-parameter calculation
    const { calculateAssessmentAverage } = await import('@/utils/trainerStats')

    for (const assessment of assessments) {
      const assessor = assessorMap.get(assessment.assessor_id)
      const trainer = trainerMap.get(assessment.trainer_id)

      if (assessor && trainer) {
        // Calculate average rating using 21-parameter system
        const avg = calculateAssessmentAverage(assessment as any)

        activities.push({
          id: assessment.id,
          type: 'assessment_created',
          actor: {
            id: assessment.assessor_id,
            name: assessor.full_name,
            role: assessor.role || 'manager',
          },
          target: {
            id: assessment.trainer_id,
            name: trainer.full_name,
            type: 'trainer',
          },
          metadata: {
            rating: avg.toFixed(2),
            assessmentDate: assessment.assessment_date,
          },
          timestamp: new Date(assessment.created_at || assessment.assessment_date),
          message: `${assessor.full_name} assessed ${trainer.full_name} - Rating: ${avg.toFixed(2)}/5.0`,
        })
      }
    }
  } catch (error) {
    console.error('Error fetching activity:', error)
  }

  // Sort by timestamp (most recent first)
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Subscribe to real-time activity updates
 */
export const subscribeToActivity = (
  callback: (activity: ActivityItem) => void
): () => void => {
  const channel = supabase
    .channel('activity-feed')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'assessments',
      },
      async (payload) => {
        try {
          const assessment = payload.new as any

          // Fetch profiles separately
          const [assessorResult, trainerResult] = await Promise.all([
            supabase.from('profiles').select('id, full_name, role').eq('id', assessment.assessor_id).single(),
            supabase.from('profiles').select('id, full_name').eq('id', assessment.trainer_id).single(),
          ])

          const assessor = assessorResult.data
          const trainer = trainerResult.data

          if (assessor && trainer) {
            // Import calculateAssessmentAverage for 21-parameter calculation
            const { calculateAssessmentAverage } = await import('@/utils/trainerStats')
            const avg = calculateAssessmentAverage(assessment as any)

            const activity: ActivityItem = {
              id: assessment.id,
              type: 'assessment_created',
              actor: {
                id: assessment.assessor_id,
                name: assessor.full_name,
                role: assessor.role || 'manager',
              },
              target: {
                id: assessment.trainer_id,
                name: trainer.full_name,
                type: 'trainer',
              },
              metadata: {
                rating: avg.toFixed(2),
                assessmentDate: assessment.assessment_date,
              },
              timestamp: new Date(),
              message: `${assessor.full_name} assessed ${trainer.full_name} - Rating: ${avg.toFixed(2)}/5.0`,
            }

            callback(activity)
          }
        } catch (error) {
          console.error('Error processing activity update:', error)
        }
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Format time ago
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}
