import { useState } from 'react'
import { HelpCircle, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
        className="text-gray-400 hover:text-primary-600 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl ${positionClasses[position]}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <p className="mb-2">{content}</p>
            {link && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-300 hover:text-primary-200 text-xs"
              >
                <span>{link.text}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === 'top'
                  ? 'top-full left-1/2 -translate-x-1/2 -mt-1'
                  : position === 'bottom'
                  ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1'
                  : position === 'left'
                  ? 'left-full top-1/2 -translate-y-1/2 -ml-1'
                  : 'right-full top-1/2 -translate-y-1/2 -mr-1'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ContextualHelp
