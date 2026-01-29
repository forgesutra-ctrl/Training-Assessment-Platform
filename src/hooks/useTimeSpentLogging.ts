/**
 * Logs time spent on the system while the user is on Manager or Trainer dashboard.
 * Sends a heartbeat every 60 seconds; admins see totals in Manager Activity / Trainer Performance.
 */

import { useEffect, useRef } from 'react'
import { recordTimeSpent, HEARTBEAT_INTERVAL_MS } from '@/utils/timeSpentLogging'

export function useTimeSpentLogging(role: 'manager' | 'trainer' | null, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled || role !== 'manager' && role !== 'trainer') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // First tick after 60s; then every 60s
    const tick = () => recordTimeSpent(role)
    intervalRef.current = setInterval(tick, HEARTBEAT_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, role])

  return null
}
