import { ReactNode } from 'react'

interface AnimatedInputProps {
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  label?: string
  error?: string
  icon?: ReactNode
  className?: string
  required?: boolean
  disabled?: boolean
}

const AnimatedInput = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  icon,
  className = '',
  required = false,
  disabled = false,
}: AnimatedInputProps) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-red-300 focus:ring-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          required={required}
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default AnimatedInput
