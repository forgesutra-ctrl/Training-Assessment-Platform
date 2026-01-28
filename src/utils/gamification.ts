/**
 * Gamification Utilities
 * Functions for badges, XP, goals, streaks, and leaderboards
 */

import { supabase } from '@/lib/supabase'
import {
  Badge,
  UserBadge,
  Goal,
  UserXP,
  XPHistory,
  Streak,
  LeaderboardEntry,
  LeaderboardPreference,
} from '@/types'

/**
 * Check if gamification is enabled
 */
export const isGamificationEnabled = (): boolean => {
  return import.meta.env.VITE_GAMIFICATION_ENABLED === 'true'
}

/**
 * Fetch all available badges
 */
export const fetchAllBadges = async (): Promise<Badge[]> => {
  try {
    const { data, error } = await supabase.from('badges').select('*').order('rarity', { ascending: false })

    if (error) {
      // Table doesn't exist or RLS blocks access
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
        console.warn('Badges table not accessible:', error.message)
        return []
      }
      throw error
    }
    return data || []
  } catch (error: any) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
      console.warn('Badges table not accessible:', error.message)
      return []
    }
    throw error
  }
}

/**
 * Fetch user's earned badges
 */
export const fetchUserBadges = async (userId: string): Promise<UserBadge[]> => {
  // Fetch user badges first
  const { data: userBadges, error: badgesError } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (badgesError) throw badgesError

  if (!userBadges || userBadges.length === 0) {
    return []
  }

  // Fetch badge details separately
  const badgeIds = [...new Set(userBadges.map((ub: any) => ub.badge_id).filter(Boolean))]
  let badgeMap = new Map<string, any>()

  if (badgeIds.length > 0) {
    let query = supabase.from('badges').select('*')
    const { data: badges, error: badgeDetailsError } = badgeIds.length === 1
      ? await query.eq('id', badgeIds[0])
      : await query.in('id', badgeIds)

    if (!badgeDetailsError && badges) {
      const badgesArray = Array.isArray(badges) ? badges : [badges]
      badgesArray.forEach((badge: any) => {
        badgeMap.set(badge.id, badge)
      })
    }
  }

  // Combine user badges with badge details
  return userBadges.map((ub: any) => ({
    ...ub,
    badge: badgeMap.get(ub.badge_id) || null,
  }))
}

/**
 * Award badge to user
 */
export const awardBadge = async (userId: string, badgeCode: string): Promise<void> => {
  // Get badge ID
  const { data: badge } = await supabase.from('badges').select('id').eq('code', badgeCode).single()

  if (!badge) throw new Error('Badge not found')

  // Check if user already has badge
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badge.id)
    .single()

  if (existing) return // Already has badge

  // Award badge
  const { error } = await supabase.from('user_badges').insert({
    user_id: userId,
    badge_id: badge.id,
  })

  if (error) throw error

  // Award bonus XP for badge
  await awardXP(userId, 50, 'badge', badge.id, `Badge earned: ${badgeCode}`)
}

/**
 * Check and award badges based on performance
 */
export const checkAndAwardBadges = async (userId: string, assessments: any[]): Promise<string[]> => {
  if (!isGamificationEnabled()) return []

  const awarded: string[] = []

  if (assessments.length === 0) return awarded

  // First 4+ rating
  const hasFirst4Plus = assessments.some((a) => a.average_score >= 4.0)
  if (hasFirst4Plus) {
    try {
      await awardBadge(userId, 'rising_star')
      awarded.push('rising_star')
    } catch (e) {
      // Already has badge
    }
  }

  // First assessment
  if (assessments.length === 1) {
    try {
      await awardBadge(userId, 'first_assessment')
      awarded.push('first_assessment')
    } catch (e) {
      // Already has badge
    }
  }

  // Perfect score
  const hasPerfect = assessments.some((a) => a.average_score >= 4.95)
  if (hasPerfect) {
    try {
      await awardBadge(userId, 'perfect_score')
      awarded.push('perfect_score')
    } catch (e) {
      // Already has badge
    }
  }

  // 5 consecutive 4+ ratings
  if (assessments.length >= 5) {
    const recent5 = assessments.slice(0, 5)
    const all4Plus = recent5.every((a) => a.average_score >= 4.0)
    if (all4Plus) {
      try {
        await awardBadge(userId, 'consistency_king')
        awarded.push('consistency_king')
      } catch (e) {
        // Already has badge
      }
    }
  }

  // All parameters above 4
  const recent = assessments[0]
  if (recent) {
    const params = [
      recent.trainers_readiness,
      recent.communication_skills,
      recent.domain_expertise,
      recent.knowledge_displayed,
      recent.people_management,
      recent.technical_skills,
    ]
    if (params.every((p) => p >= 4.0)) {
      try {
        await awardBadge(userId, 'all_rounder')
        awarded.push('all_rounder')
      } catch (e) {
        // Already has badge
      }
    }
  }

  return awarded
}

/**
 * Fetch user XP and level
 */
export const fetchUserXP = async (userId: string): Promise<UserXP | null> => {
  try {
    const { data, error } = await supabase.from('user_xp').select('*').eq('user_id', userId).single()

    if (error) {
      // Table doesn't exist, RLS blocks access, or 403/406 errors
      if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 403 || error.status === 406 || error.message?.includes('relation') || error.message?.includes('permission')) {
        console.warn('XP table not accessible:', error.message)
        return null
      }
      throw error
    }

    if (!data) return null

    // Ensure all required fields have default values
    const currentLevel = data.current_level || 1
    const totalXP = data.total_xp || 0
    const levelXP = data.level_xp || 0

    // Calculate XP for next level
    const xpForNext = getXPForNextLevel(currentLevel)
    const xpInCurrentLevel = totalXP - getTotalXPForLevel(currentLevel - 1)
    const progress = xpForNext > 0 ? (xpInCurrentLevel / xpForNext) * 100 : 100

    return {
      ...data,
      current_level: currentLevel,
      total_xp: totalXP,
      level_xp: levelXP,
      xp_for_next_level: xpForNext,
      progress_to_next_level: Math.min(100, Math.max(0, progress)),
    }
  } catch (error: any) {
    // Handle any unexpected errors gracefully
    if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 403 || error.status === 406 || error.message?.includes('relation') || error.message?.includes('permission')) {
      console.warn('XP table not accessible:', error.message)
      return null
    }
    throw error
  }
}

/**
 * Award XP to user
 */
export const awardXP = async (
  userId: string,
  amount: number,
  source: string,
  sourceId: string | null = null,
  description: string | null = null
): Promise<void> => {
  // Get current XP
  const current = await fetchUserXP(userId)
  const currentTotal = current?.total_xp || 0
  const currentLevel = current?.current_level || 1
  const newTotal = currentTotal + amount
  const newLevel = calculateLevel(newTotal)

  // Update XP
  const { error: xpError } = await supabase
    .from('user_xp')
    .upsert({
      user_id: userId,
      total_xp: newTotal,
      current_level: newLevel,
      level_xp: newTotal - getTotalXPForLevel(newLevel - 1),
      updated_at: new Date().toISOString(),
      ...(newLevel > currentLevel ? { level_up_at: new Date().toISOString() } : {}),
    })

  if (xpError) throw xpError

  // Log XP history
  const { error: historyError } = await supabase.from('xp_history').insert({
    user_id: userId,
    xp_amount: amount,
    source,
    source_id: sourceId,
    description,
  })

  if (historyError) throw historyError

  // Function returns void - level up is handled by database trigger
}

/**
 * Calculate level from total XP
 */
export const calculateLevel = (totalXP: number): number => {
  if (totalXP >= 8000) return 6 // Master
  if (totalXP >= 4000) return 5 // Expert
  if (totalXP >= 2000) return 4 // Proficient
  if (totalXP >= 1000) return 3 // Competent
  if (totalXP >= 500) return 2 // Learner
  return 1 // Novice
}

/**
 * Get XP needed for next level
 */
export const getXPForNextLevel = (currentLevel: number): number => {
  const levels = [0, 500, 1000, 2000, 4000, 8000, 8000]
  if (currentLevel >= 6) return 0 // Max level
  return levels[currentLevel + 1] - levels[currentLevel]
}

/**
 * Get total XP needed for a level
 */
export const getTotalXPForLevel = (level: number): number => {
  const levels = [0, 500, 1000, 2000, 4000, 8000]
  return levels[Math.min(level, 5)] || 0
}

/**
 * Get level name
 */
export const getLevelName = (level: number): string => {
  const names = ['', 'Novice', 'Learner', 'Competent', 'Proficient', 'Expert', 'Master']
  return names[level] || 'Unknown'
}

/**
 * Fetch user goals
 */
export const fetchUserGoals = async (userId: string): Promise<Goal[]> => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      // Table doesn't exist or RLS blocks access
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
        console.warn('Goals table not accessible:', error.message)
        return []
      }
      throw error
    }

    // Calculate progress for each goal
    return (data || []).map((goal) => ({
      ...goal,
      progress: calculateGoalProgress(goal),
    }))
  } catch (error: any) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
      console.warn('Goals table not accessible:', error.message)
      return []
    }
    throw error
  }
}

/**
 * Calculate goal progress
 */
const calculateGoalProgress = (goal: Goal): number => {
  // This would need actual data to calculate
  // For now, return 0
  return 0
}

/**
 * Create a goal
 */
export const createGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'completed_at'>): Promise<Goal> => {
  const { data, error } = await supabase.from('goals').insert(goalData).select().single()

  if (error) throw error
  return { ...data, progress: 0 }
}

/**
 * Update goal
 */
export const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single()

  if (error) throw error
  return { ...data, progress: 0 }
}

/**
 * Fetch user streaks
 */
export const fetchUserStreaks = async (userId: string): Promise<Streak[]> => {
  try {
    const { data, error } = await supabase.from('streaks').select('*').eq('user_id', userId)

    if (error) {
      // Table doesn't exist, RLS blocks access, or 403/406 errors
      if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 403 || error.status === 406 || error.message?.includes('relation') || error.message?.includes('permission')) {
        console.warn('Streaks table not accessible:', error.message)
        return []
      }
      throw error
    }
    return data || []
  } catch (error: any) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 403 || error.status === 406 || error.message?.includes('relation') || error.message?.includes('permission')) {
      console.warn('Streaks table not accessible:', error.message)
      return []
    }
    throw error
  }
}

/**
 * Update streak
 */
export const updateStreak = async (
  userId: string,
  type: string,
  activityDate: string
): Promise<Streak> => {
  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .single()

  const activity = new Date(activityDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  activity.setHours(0, 0, 0, 0)

  if (!existing) {
    // Create new streak
    const { data, error } = await supabase
      .from('streaks')
      .insert({
        user_id: userId,
        type,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: activityDate,
        streak_start_date: activityDate,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Check if continuing streak
  const lastActivity = existing.last_activity_date
    ? new Date(existing.last_activity_date)
    : null
  const daysDiff = lastActivity ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999

  let newStreak = existing.current_streak
  let startDate = existing.streak_start_date

  if (daysDiff === 1) {
    // Continue streak
    newStreak = existing.current_streak + 1
  } else if (daysDiff > 1) {
    // Break streak, start new
    newStreak = 1
    startDate = activityDate
  }
  // If daysDiff === 0, same day, don't update

  const longestStreak = Math.max(existing.longest_streak, newStreak)

  const { data, error } = await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: activityDate,
      streak_start_date: startDate,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('type', type)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch leaderboard
 */
export const fetchLeaderboard = async (
  type: 'top_performers' | 'most_improved' | 'consistency' | 'parameter',
  period: 'month' | 'quarter' | 'year' | 'all-time' = 'month',
  parameter?: string,
  currentUserId?: string
): Promise<LeaderboardEntry[]> => {
  // This would need complex queries based on type
  // For now, return empty array
  // Implementation would fetch from assessments and calculate rankings
  return []
}

/**
 * Get leaderboard preference
 */
export const getLeaderboardPreference = async (userId: string): Promise<LeaderboardPreference | null> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Table doesn't exist, RLS blocks access, 403/406 errors, or record not found
      if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 403 || error.status === 406 || error.message?.includes('relation') || error.message?.includes('permission')) {
        console.warn('Leaderboard preferences table not accessible:', error.message)
        return null
      }
      throw error
    }

    return data
  } catch (error: any) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 403 || error.status === 406 || error.message?.includes('relation') || error.message?.includes('permission')) {
      console.warn('Leaderboard preferences table not accessible:', error.message)
      return null
    }
    throw error
  }
}

/**
 * Update leaderboard preference
 */
export const updateLeaderboardPreference = async (
  userId: string,
  optIn: boolean,
  showName: boolean = true
): Promise<LeaderboardPreference> => {
  const { data, error } = await supabase
    .from('leaderboard_preferences')
    .upsert({
      user_id: userId,
      opt_in: optIn,
      show_name: showName,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch XP history
 */
export const fetchXPHistory = async (userId: string, limit: number = 20): Promise<XPHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('xp_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // Table doesn't exist or RLS blocks access
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
        console.warn('XP history table not accessible:', error.message)
        return []
      }
      throw error
    }
    return data || []
  } catch (error: any) {
    // Handle any unexpected errors gracefully
    if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
      console.warn('XP history table not accessible:', error.message)
      return []
    }
    throw error
  }
}
