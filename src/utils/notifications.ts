/**
 * Smart Alerts & Notifications System
 */

import { supabase } from '@/lib/supabase'
import { subscribeToActivity, ActivityItem } from './activityFeed'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'assessment' | 'alert' | 'achievement'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

class NotificationService {
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private unsubscribers: (() => void)[] = []

  constructor() {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Subscribe to real-time activity
    const unsubscribe = subscribeToActivity((activity) => {
      this.addNotification({
        id: `activity-${activity.id}`,
        type: 'assessment',
        title: 'New Assessment',
        message: activity.message,
        timestamp: activity.timestamp,
        read: false,
        actionUrl: '/admin/dashboard?tab=trainer-performance',
        metadata: activity.metadata,
      })
    })

    this.unsubscribers.push(unsubscribe)
  }

  /**
   * Add a notification
   */
  addNotification(notification: Notification) {
    this.notifications.unshift(notification)
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      })
    }

    this.notifyListeners()
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.notifyListeners()
  }

  /**
   * Remove notification
   */
  removeNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.notifyListeners()
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return this.notifications
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback)
    callback(this.notifications) // Initial call

    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach((callback) => callback([...this.notifications]))
  }

  /**
   * Cleanup
   */
  destroy() {
    this.unsubscribers.forEach((unsub) => unsub())
    this.unsubscribers = []
    this.listeners.clear()
  }
}

// Singleton instance
export const notificationService = new NotificationService()

/**
 * Check for alerts based on configurable rules
 */
export const checkAlerts = async (userId: string, userRole: string): Promise<Notification[]> => {
  const alerts: Notification[] = []

  try {
    if (userRole === 'manager') {
      // Check for trainers not assessed this month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data: eligibleTrainers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'trainer')
        .neq('reporting_manager_id', userId)

      const { data: recentAssessments } = await supabase
        .from('assessments')
        .select('trainer_id')
        .eq('assessor_id', userId)
        .gte('assessment_date', monthStart.toISOString().split('T')[0])

      const assessedIds = new Set(recentAssessments?.map((a) => a.trainer_id) || [])
      const unassessed = eligibleTrainers?.filter((t) => !assessedIds.has(t.id)) || []

      if (unassessed.length > 0) {
        alerts.push({
          id: `unassessed-${userId}`,
          type: 'warning',
          title: 'Action Required',
          message: `You have ${unassessed.length} trainer${unassessed.length > 1 ? 's' : ''} to assess this month`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/manager/assessment/new',
          actionLabel: 'Assess Now',
        })
      }
    } else if (userRole === 'trainer') {
      // Check for low performance
      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .eq('trainer_id', userId)
        .order('assessment_date', { ascending: false })
        .limit(5)

      if (assessments && assessments.length > 0) {
        const recent = assessments[0]
        const avg =
          (recent.trainers_readiness +
            recent.communication_skills +
            recent.domain_expertise +
            recent.knowledge_displayed +
            recent.people_management +
            recent.technical_skills) /
          6

        if (avg < 3.0) {
          alerts.push({
            id: `low-performance-${userId}`,
            type: 'warning',
            title: 'Performance Alert',
            message: `Your recent assessment score is ${avg.toFixed(2)}/5.0. Review feedback for improvement areas.`,
            timestamp: new Date(),
            read: false,
            actionUrl: '/trainer/dashboard',
            actionLabel: 'View Details',
          })
        }
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error)
  }

  return alerts
}
