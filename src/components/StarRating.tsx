import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
}

const StarRating = ({ value, onChange, label, required, error, disabled = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverValue(null)
    }
  }

  const displayValue = hoverValue ?? value

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1" role="radiogroup" aria-label={label || 'Rating'}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled}
              className={`transition-all duration-150 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
              }`}
              aria-label={`Rate ${rating} out of 5`}
              aria-pressed={value === rating}
            >
              <Star
                className={`w-8 h-8 ${
                  rating <= displayValue
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                } transition-colors duration-150`}
              />
            </button>
          ))}
        </div>
        {value > 0 && (
          <span className="text-lg font-semibold text-gray-700 min-w-[3rem]">
            {value} / 5
          </span>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {!error && value === 0 && required && (
        <p className="text-sm text-gray-500 mt-1">Please select a rating</p>
      )}
    </div>
  )
}

export default StarRating
