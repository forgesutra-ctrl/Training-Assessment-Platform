interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const LoadingSpinner = ({ size = 'md', className = '', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const borderSizeClasses = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${borderSizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
