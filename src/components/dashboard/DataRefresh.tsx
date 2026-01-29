import { useState, useCallback } from 'react'
import { RefreshCw, Clock } from 'lucide-react'

interface DataRefreshProps {
  onRefresh: () => Promise<void> | void
  showTimestamp?: boolean
}

const DataRefresh = ({
  onRefresh,
  showTimestamp = true,
}: DataRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSecs < 60) return 'Just now'
    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleTimeString()
  }

  return (
    <div className="flex items-center gap-3">
      {showTimestamp && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Updated {formatTimeAgo(lastUpdated)}</span>
        </div>
      )}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh data"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

export default DataRefresh
