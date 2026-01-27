import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { shake } from '@/utils/animations'

interface ShakeOnErrorProps {
  hasError: boolean
  children: ReactNode
  className?: string
}

const ShakeOnError = ({ hasError, children, className = '' }: ShakeOnErrorProps) => {
  return (
    <motion.div
      animate={hasError ? shake : {}}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default ShakeOnError
