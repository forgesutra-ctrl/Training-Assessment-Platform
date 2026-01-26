import { AssessmentWithDetails, ParameterAverage, TrendDataPoint } from '@/types'

export type DateRange = 'current-month' | 'last-3-months' | 'last-6-months' | 'year-to-date' | 'all-time'

const PARAMETER_NAMES = {
  trainers_readiness: "Trainer's Readiness",
  communication_skills: 'Communication Skills',
  domain_expertise: 'Domain Expertise',
  knowledge_displayed: 'Knowledge Displayed',
  people_management: 'People Management',
  technical_skills: 'Technical Skills',
} as const

/**
 * Calculate overall average rating from assessments
 */
export const calculateAverageRating = (assessments: AssessmentWithDetails[]): number => {
  if (assessments.length === 0) return 0

  const total = assessments.reduce((sum, assessment) => sum + assessment.average_score, 0)
  return Number((total / assessments.length).toFixed(2))
}

/**
 * Calculate average for each parameter
 */
export const calculateParameterAverages = (
  assessments: AssessmentWithDetails[]
): ParameterAverage[] => {
  if (assessments.length === 0) {
    return Object.keys(PARAMETER_NAMES).map((key) => ({
      parameter: PARAMETER_NAMES[key as keyof typeof PARAMETER_NAMES],
      average: 0,
      count: 0,
    }))
  }

  const parameterKeys = [
    'trainers_readiness',
    'communication_skills',
    'domain_expertise',
    'knowledge_displayed',
    'people_management',
    'technical_skills',
  ] as const

  return parameterKeys.map((key) => {
    const sum = assessments.reduce((acc, assessment) => {
      return acc + (assessment[key] as number)
    }, 0)
    const average = sum / assessments.length

    return {
      parameter: PARAMETER_NAMES[key],
      average: Number(average.toFixed(2)),
      count: assessments.length,
    }
  })
}

/**
 * Get best performing parameter
 */
export const getBestParameter = (parameterAverages: ParameterAverage[]): ParameterAverage => {
  if (parameterAverages.length === 0) {
    return { parameter: 'N/A', average: 0, count: 0 }
  }

  return parameterAverages.reduce((best, current) =>
    current.average > best.average ? current : best
  )
}

/**
 * Get worst performing parameter (needs improvement)
 */
export const getWorstParameter = (parameterAverages: ParameterAverage[]): ParameterAverage => {
  if (parameterAverages.length === 0) {
    return { parameter: 'N/A', average: 0, count: 0 }
  }

  return parameterAverages.reduce((worst, current) =>
    current.average < worst.average ? current : worst
  )
}

/**
 * Get monthly trend data
 */
export const getMonthlyTrend = (
  assessments: AssessmentWithDetails[],
  months: number = 6
): TrendDataPoint[] => {
  const now = new Date()
  const trendData: TrendDataPoint[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthAssessments = assessments.filter((assessment) => {
      const assessmentDate = new Date(assessment.assessment_date)
      return assessmentDate >= monthStart && assessmentDate <= monthEnd
    })

    const monthAverage =
      monthAssessments.length > 0
        ? calculateAverageRating(monthAssessments)
        : 0

    trendData.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      average: monthAverage,
      count: monthAssessments.length,
    })
  }

  return trendData
}

/**
 * Filter assessments by date range
 */
export const filterAssessmentsByDateRange = (
  assessments: AssessmentWithDetails[],
  range: DateRange
): AssessmentWithDetails[] => {
  const now = new Date()
  let startDate: Date

  switch (range) {
    case 'current-month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'last-3-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      break
    case 'last-6-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      break
    case 'year-to-date':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case 'all-time':
      return assessments
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return assessments.filter((assessment) => {
    const assessmentDate = new Date(assessment.assessment_date)
    return assessmentDate >= startDate
  })
}

/**
 * Get score color based on value
 */
export const getScoreColor = (score: number): string => {
  if (score >= 4) return 'text-green-600'
  if (score >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get score background color
 */
export const getScoreBgColor = (score: number): string => {
  if (score >= 4) return 'bg-green-500'
  if (score >= 3) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Get progress percentage (0-100) for a score (0-5)
 */
export const getProgressPercentage = (score: number): number => {
  return Math.round((score / 5) * 100)
}

/**
 * Format date range label
 */
export const getDateRangeLabel = (range: DateRange): string => {
  const labels: Record<DateRange, string> = {
    'current-month': 'Current Month',
    'last-3-months': 'Last 3 Months',
    'last-6-months': 'Last 6 Months',
    'year-to-date': 'Year to Date',
    'all-time': 'All Time',
  }
  return labels[range]
}
