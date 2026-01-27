import { AssessmentWithDetails, ParameterAverage, TrendDataPoint, CategoryAverage, ASSESSMENT_STRUCTURE } from '@/types'

export type DateRange = 'current-month' | 'last-3-months' | 'last-6-months' | 'year-to-date' | 'all-time'

// Get all parameter IDs from the assessment structure
const getAllParameterIds = (): string[] => {
  const paramIds: string[] = []
  ASSESSMENT_STRUCTURE.categories.forEach((category) => {
    category.parameters.forEach((param) => {
      paramIds.push(param.id)
    })
  })
  return paramIds
}

// Get parameter label by ID
const getParameterLabel = (paramId: string): string => {
  for (const category of ASSESSMENT_STRUCTURE.categories) {
    const param = category.parameters.find((p) => p.id === paramId)
    if (param) return param.label
  }
  return paramId
}

/**
 * Calculate overall average rating from assessments (using all 21 parameters)
 */
export const calculateAverageRating = (assessments: AssessmentWithDetails[]): number => {
  if (assessments.length === 0) return 0

  const paramIds = getAllParameterIds()
  let totalSum = 0
  let totalCount = 0

  assessments.forEach((assessment) => {
    paramIds.forEach((paramId) => {
      const rating = (assessment as any)[paramId] as number | null
      if (rating && rating > 0) {
        totalSum += rating
        totalCount++
      }
    })
  })

  return totalCount > 0 ? Number((totalSum / totalCount).toFixed(2)) : 0
}

/**
 * Calculate average score for a single assessment (all 21 parameters)
 */
export const calculateAssessmentAverage = (assessment: AssessmentWithDetails): number => {
  const paramIds = getAllParameterIds()
  let sum = 0
  let count = 0

  paramIds.forEach((paramId) => {
    const rating = (assessment as any)[paramId] as number | null
    if (rating && rating > 0) {
      sum += rating
      count++
    }
  })

  return count > 0 ? Number((sum / count).toFixed(2)) : 0
}

/**
 * Calculate average for each of the 21 parameters
 */
export const calculateParameterAverages = (
  assessments: AssessmentWithDetails[]
): ParameterAverage[] => {
  const paramIds = getAllParameterIds()

  if (assessments.length === 0) {
    return paramIds.map((paramId) => ({
      parameter: getParameterLabel(paramId),
      average: 0,
      count: 0,
    }))
  }

  return paramIds.map((paramId) => {
    let sum = 0
    let count = 0

    assessments.forEach((assessment) => {
      const rating = (assessment as any)[paramId] as number | null
      if (rating && rating > 0) {
        sum += rating
        count++
      }
    })

    return {
      parameter: getParameterLabel(paramId),
      average: count > 0 ? Number((sum / count).toFixed(2)) : 0,
      count,
    }
  })
}

/**
 * Calculate category averages (5 categories)
 */
export const calculateCategoryAverages = (
  assessment: AssessmentWithDetails
): CategoryAverage[] => {
  return ASSESSMENT_STRUCTURE.categories.map((category) => {
    let sum = 0
    let count = 0

    category.parameters.forEach((param) => {
      const rating = (assessment as any)[param.id] as number | null
      if (rating && rating > 0) {
        sum += rating
        count++
      }
    })

    return {
      categoryId: category.id,
      categoryName: category.name,
      average: count > 0 ? Number((sum / count).toFixed(2)) : 0,
      parameterCount: count,
    }
  })
}

/**
 * Calculate category averages across multiple assessments
 */
export const calculateCategoryAveragesAcrossAssessments = (
  assessments: AssessmentWithDetails[]
): CategoryAverage[] => {
  if (assessments.length === 0) {
    return ASSESSMENT_STRUCTURE.categories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      average: 0,
      parameterCount: 0,
    }))
  }

  return ASSESSMENT_STRUCTURE.categories.map((category) => {
    let totalSum = 0
    let totalCount = 0

    assessments.forEach((assessment) => {
      category.parameters.forEach((param) => {
        const rating = (assessment as any)[param.id] as number | null
        if (rating && rating > 0) {
          totalSum += rating
          totalCount++
        }
      })
    })

    return {
      categoryId: category.id,
      categoryName: category.name,
      average: totalCount > 0 ? Number((totalSum / totalCount).toFixed(2)) : 0,
      parameterCount: totalCount,
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
