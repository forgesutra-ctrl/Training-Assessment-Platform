import { ReactNode } from 'react'

interface ShakeOnErrorProps {
  hasError: boolean
  children: ReactNode
  className?: string
}

const ShakeOnError = ({ hasError, children, className = '' }: ShakeOnErrorProps) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default ShakeOnError
