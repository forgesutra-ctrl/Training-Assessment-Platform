/**
 * Time spent logging for managers and trainers.
 * Call recordTimeSpent every ~60s while user is on Manager or Trainer dashboard.
 * Admins see aggregated time in Manager Activity and Trainer Performance.
 */

import { supabase } from '@/lib/supabase'

const HEARTBEAT_INTERVAL_MS = 60 * 1000 // 60 seconds

/**
 * Record 60 seconds of time spent for the current user in the given role.
 * Safe to call repeatedly; backend upserts daily total.
 */
export async function recordTimeSpent(role: 'manager' | 'trainer'): Promise<void> {
  try {
    await supabase.rpc('record_time_spent', { p_role: role })
  } catch (err) {
    // Table/RPC may not exist yet; avoid noisy console
    if (import.meta.env.DEV && err != null) {
      console.warn('[timeSpent] record_time_spent failed:', (err as Error).message)
    }
  }
}

export { HEARTBEAT_INTERVAL_MS }
