interface ProgressBarProps {
  progress: number // 0-100
  label?: string
  showPercentage?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  estimatedTime?: string
}

const ProgressBar = ({
  progress,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'md',
  estimatedTime,
}: ProgressBarProps) => {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  }

  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className="w-full">
      {(label || showPercentage || estimatedTime) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          <div className="flex items-center gap-3">
            {showPercentage && (
              <span className="text-sm text-gray-600">{Math.round(clampedProgress)}%</span>
            )}
            {estimatedTime && (
              <span className="text-xs text-gray-500">~{estimatedTime} remaining</span>
            )}
          </div>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          style={{ width: `${clampedProgress}%` }}
          className={`h-full ${colorClasses[color]} rounded-full`}
        />
      </div>
    </div>
  )
}

export default ProgressBar
