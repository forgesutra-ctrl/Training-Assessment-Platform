import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cardHover } from '@/utils/animations'

interface AnimatedCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  hoverable?: boolean
}

const AnimatedCard = ({
  children,
  onClick,
  className = '',
  hoverable = true,
}: AnimatedCardProps) => {
  return (
    <motion.div
      whileHover={hoverable ? cardHover : {}}
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard
