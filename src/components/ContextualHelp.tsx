import { useState } from 'react'
import { HelpCircle, X, ExternalLink } from 'lucide-react'

interface ContextualHelpProps {
  content: string
  link?: {
    url: string
    text: string
  }
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const ContextualHelp = ({ content, link, position = 'top' }: ContextualHelpProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-primary-600"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${positionClasses[position]} bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[200px] max-w-[300px]`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm text-gray-700">{content}</p>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {link && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              {link.text}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default ContextualHelp
