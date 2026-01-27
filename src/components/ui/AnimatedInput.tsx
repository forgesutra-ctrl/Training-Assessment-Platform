import { motion } from 'framer-motion'
import { useState, ReactNode } from 'react'

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
}: AnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <motion.div
        animate={{
          scale: isFocused ? 1.01 : 1,
          boxShadow: isFocused
            ? '0 0 0 3px rgba(99, 102, 241, 0.1)'
            : '0 0 0 0px rgba(99, 102, 241, 0)',
        }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-red-300 focus:ring-red-500' : ''}`}
          required={required}
        />
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

export default AnimatedInput
