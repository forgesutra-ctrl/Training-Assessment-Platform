import { supabase } from '@/lib/supabase'

export type AuditActionType =
  | 'assessment_submitted'
  | 'assessment_updated'
  | 'assessment_deleted'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_role_changed'
  | 'user_activated'
  | 'user_deactivated'
  | 'password_reset'
  | 'login_success'
  | 'login_failed'
  | 'export_data'
  | 'bulk_upload'
  | 'settings_changed'

export type AuditTargetType = 'assessment' | 'user' | 'export' | 'login' | 'settings'

export interface AuditLog {
  id: string
  user_id: string | null
  action_type: AuditActionType
  target_type: AuditTargetType | null
  target_id: string | null
  details: Record<string, any> | null
  ip_address: string | null
  created_at: string
  user_name?: string
}

export interface AuditLogFilters {
  startDate?: string
  endDate?: string
  actionType?: AuditActionType
  userId?: string
  targetType?: AuditTargetType
}

/**
 * Log an audit action
 */
export const logAuditAction = async (
  actionType: AuditActionType,
  targetType: AuditTargetType | null = null,
  targetId: string | null = null,
  details: Record<string, any> | null = null,
  userId: string | null = null
): Promise<void> => {
  try {
    // Get current user if not provided
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const currentUserId = userId || user?.id || null

    // Get IP address (would need to be passed from the application)
    // For now, we'll leave it null

    // Call the database function
    const { error } = await supabase.rpc('log_audit_action', {
      p_user_id: currentUserId,
      p_action_type: actionType,
      p_target_type: targetType,
      p_target_id: targetId,
      p_details: details,
      p_ip_address: null, // Would need to be passed from application
    })

    if (error) {
      console.error('Error logging audit action:', error)
      // Don't throw - audit logging should not break the application
    }
  } catch (error) {
    console.error('Error logging audit action:', error)
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Fetch audit logs with filters
 */
export const fetchAuditLogs = async (
  filters: AuditLogFilters = {},
  limit: number = 100,
  offset: number = 0
): Promise<{ logs: AuditLog[]; total: number }> => {
  try {
    // First, fetch audit logs
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.targetType) {
      query = query.eq('target_type', filters.targetType)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Get unique user IDs from logs
    const userIds = [...new Set((data || []).map((log: any) => log.user_id).filter(Boolean))]

    // Fetch profiles for those users
    let profilesMap: Record<string, string> = {}
    if (userIds.length > 0) {
      let query = supabase.from('profiles').select('id, full_name')
      const { data: profiles } = userIds.length === 1
        ? await query.eq('id', userIds[0])
        : await query.in('id', userIds)

      if (profiles) {
        profilesMap = profiles.reduce((acc: Record<string, string>, profile: any) => {
          acc[profile.id] = profile.full_name
          return acc
        }, {})
      }
    }

    // Map logs with user names
    const logs: AuditLog[] = (data || []).map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      action_type: log.action_type,
      target_type: log.target_type,
      target_id: log.target_id,
      details: log.details,
      ip_address: log.ip_address,
      created_at: log.created_at,
      user_name: log.user_id ? profilesMap[log.user_id] || null : null,
    }))

    return {
      logs,
      total: count || 0,
    }
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    throw error
  }
}

/**
 * Export audit logs as CSV
 */
export const exportAuditLogsAsCSV = (logs: AuditLog[]): string => {
  const headers = ['Timestamp', 'User', 'Action Type', 'Target Type', 'Target ID', 'Details', 'IP Address']
  const rows = logs.map((log) => [
    new Date(log.created_at).toISOString(),
    log.user_name || 'System',
    log.action_type,
    log.target_type || 'N/A',
    log.target_id || 'N/A',
    JSON.stringify(log.details || {}),
    log.ip_address || 'N/A',
  ])

  const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
  return csv
}

/**
 * Download audit logs as CSV file
 */
export const downloadAuditLogsCSV = (logs: AuditLog[]) => {
  const csv = exportAuditLogsAsCSV(logs)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
