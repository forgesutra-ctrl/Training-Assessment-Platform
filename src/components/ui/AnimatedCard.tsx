import { ReactNode } from 'react'

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
    <div
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default AnimatedCard
