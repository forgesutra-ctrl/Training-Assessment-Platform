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
    const { data: assessments } = await supabase
      .from('assessments')
      .select(`
        id,
        assessment_date,
        assessor_id,
        trainer_id,
        assessor:profiles!assessor_id(full_name, role),
        trainer:profiles!trainer_id(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (assessments) {
      for (const assessment of assessments) {
        const assessor = Array.isArray(assessment.assessor) ? assessment.assessor[0] : assessment.assessor
        const trainer = Array.isArray(assessment.trainer) ? assessment.trainer[0] : assessment.trainer

        if (assessor && trainer) {
          // Calculate average rating
          const avg =
            (assessment.trainers_readiness +
              assessment.communication_skills +
              assessment.domain_expertise +
              assessment.knowledge_displayed +
              assessment.people_management +
              assessment.technical_skills) /
            6

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
          // Fetch the new assessment with related data
          const { data: assessment } = await supabase
            .from('assessments')
            .select(`
              id,
              assessment_date,
              assessor_id,
              trainer_id,
              assessor:profiles!assessor_id(full_name, role),
              trainer:profiles!trainer_id(full_name)
            `)
            .eq('id', payload.new.id)
            .single()

          if (assessment) {
            const assessor = Array.isArray(assessment.assessor) ? assessment.assessor[0] : assessment.assessor
            const trainer = Array.isArray(assessment.trainer) ? assessment.trainer[0] : assessment.trainer

            if (assessor && trainer) {
              const avg =
                (assessment.trainers_readiness +
                  assessment.communication_skills +
                  assessment.domain_expertise +
                  assessment.knowledge_displayed +
                  assessment.people_management +
                  assessment.technical_skills) /
                6

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
