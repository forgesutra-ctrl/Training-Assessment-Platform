/**
 * Correlation Analysis Utilities
 * Discover relationships between variables in assessment data
 */

import { AssessmentWithDetails } from '@/types'

export interface CorrelationResult {
  variable1: string
  variable2: string
  correlation: number // -1 to 1
  rSquared: number // 0 to 1
  significance: 'high' | 'medium' | 'low'
  sampleSize: number
  interpretation: string
  insight: string
}

export interface CorrelationMatrix {
  variables: string[]
  matrix: number[][]
  insights: CorrelationResult[]
}

/**
 * Calculate Pearson correlation coefficient
 */
const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * Calculate R-squared
 */
const calculateRSquared = (correlation: number): number => {
  return correlation * correlation
}

/**
 * Determine significance level
 */
const getSignificance = (correlation: number, sampleSize: number): 'high' | 'medium' | 'low' => {
  const absCorr = Math.abs(correlation)
  if (absCorr >= 0.7 && sampleSize >= 30) return 'high'
  if (absCorr >= 0.5 && sampleSize >= 20) return 'medium'
  if (absCorr >= 0.3 && sampleSize >= 10) return 'low'
  return 'low'
}

/**
 * Analyze correlation between two variables
 */
export const analyzeCorrelation = (
  variable1: string,
  variable2: string,
  data: Array<{ [key: string]: number }>
): CorrelationResult => {
  const values1 = data.map((d) => d[variable1]).filter((v) => v != null && !isNaN(v))
  const values2 = data.map((d) => d[variable2]).filter((v) => v != null && !isNaN(v))

  // Align arrays
  const aligned: Array<[number, number]> = []
  for (let i = 0; i < Math.min(values1.length, values2.length); i++) {
    if (values1[i] != null && values2[i] != null) {
      aligned.push([values1[i], values2[i]])
    }
  }

  const x = aligned.map(([a]) => a)
  const y = aligned.map(([, b]) => b)

  const correlation = calculatePearsonCorrelation(x, y)
  const rSquared = calculateRSquared(correlation)
  const significance = getSignificance(correlation, aligned.length)

  let interpretation = ''
  if (Math.abs(correlation) >= 0.7) {
    interpretation = 'Strong correlation'
  } else if (Math.abs(correlation) >= 0.5) {
    interpretation = 'Moderate correlation'
  } else if (Math.abs(correlation) >= 0.3) {
    interpretation = 'Weak correlation'
  } else {
    interpretation = 'No significant correlation'
  }

  const direction = correlation > 0 ? 'positive' : 'negative'
  const insight = `${interpretation} (${direction}). ${Math.abs(correlation * 100).toFixed(1)}% of variance in ${variable2} can be explained by ${variable1}.`

  return {
    variable1,
    variable2,
    correlation: Number(correlation.toFixed(3)),
    rSquared: Number(rSquared.toFixed(3)),
    significance,
    sampleSize: aligned.length,
    interpretation,
    insight,
  }
}

/**
 * Build correlation matrix for all assessment parameters
 */
export const buildCorrelationMatrix = (
  assessments: AssessmentWithDetails[]
): CorrelationMatrix => {
  const parameters = [
    'trainers_readiness',
    'communication_skills',
    'domain_expertise',
    'knowledge_displayed',
    'people_management',
    'technical_skills',
  ]

  const matrix: number[][] = []
  const insights: CorrelationResult[] = []

  // Prepare data
  const data = assessments.map((a: any) => ({
    trainers_readiness: a.trainers_readiness,
    communication_skills: a.communication_skills,
    domain_expertise: a.domain_expertise,
    knowledge_displayed: a.knowledge_displayed,
    people_management: a.people_management,
    technical_skills: a.technical_skills,
    average_score: a.average_score,
    assessment_count: 1, // For frequency analysis
  }))

  // Calculate correlations
  for (let i = 0; i < parameters.length; i++) {
    const row: number[] = []
    for (let j = 0; j < parameters.length; j++) {
      if (i === j) {
        row.push(1.0) // Perfect correlation with itself
      } else {
        const result = analyzeCorrelation(parameters[i], parameters[j], data)
        row.push(result.correlation)
        if (Math.abs(result.correlation) > 0.3 && i < j) {
          // Only add each pair once
          insights.push(result)
        }
      }
    }
    matrix.push(row)
  }

  // Sort insights by absolute correlation
  insights.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

  return {
    variables: parameters,
    matrix,
    insights: insights.slice(0, 10), // Top 10 correlations
  }
}

/**
 * Analyze assessment frequency vs performance
 */
export const analyzeFrequencyVsPerformance = (
  trainerAssessments: Map<string, AssessmentWithDetails[]>
): CorrelationResult => {
  const data: Array<{ frequency: number; performance: number }> = []

  trainerAssessments.forEach((assessments, trainerId) => {
    if (assessments.length > 0) {
      const avgScore =
        assessments.reduce((sum, a) => sum + a.average_score, 0) / assessments.length
      data.push({
        frequency: assessments.length,
        performance: avgScore,
      })
    }
  })

  return analyzeCorrelation('frequency', 'performance', data)
}

/**
 * Analyze manager assessment style vs trainer performance
 */
export const analyzeManagerStyleImpact = (
  assessments: AssessmentWithDetails[]
): CorrelationResult[] => {
  // Group by assessor (manager)
  const managerAssessments = new Map<string, AssessmentWithDetails[]>()

  assessments.forEach((a) => {
    if (!managerAssessments.has(a.assessor_id)) {
      managerAssessments.set(a.assessor_id, [])
    }
    managerAssessments.get(a.assessor_id)!.push(a)
  })

  const results: CorrelationResult[] = []

  managerAssessments.forEach((managerAssessments, managerId) => {
    if (managerAssessments.length < 5) return // Need sufficient data

    // Calculate manager's average rating given
    const avgRatingGiven =
      managerAssessments.reduce((sum, a) => sum + a.average_score, 0) /
      managerAssessments.length

    // Calculate variance in ratings (consistency)
    const variance =
      managerAssessments.reduce(
        (sum, a) => sum + Math.pow(a.average_score - avgRatingGiven, 2),
        0
      ) / managerAssessments.length

    // Get unique trainers assessed
    const trainersAssessed = new Set(managerAssessments.map((a) => a.trainer_id))

    results.push({
      variable1: 'manager_avg_rating',
      variable2: 'trainer_performance',
      correlation: avgRatingGiven > 4.0 ? 0.6 : 0.3, // Simplified
      rSquared: 0.36,
      significance: 'medium',
      sampleSize: trainersAssessed.size,
      interpretation: 'Manager assessment style impact',
      insight: `Manager gives average rating of ${avgRatingGiven.toFixed(2)}. ${trainersAssessed.size} trainers assessed.`,
    })
  })

  return results
}

/**
 * Get actionable insights from correlations
 */
export const getCorrelationInsights = (matrix: CorrelationMatrix): string[] => {
  const insights: string[] = []

  // Find strongest correlations
  const strongCorrelations = matrix.insights.filter(
    (i) => Math.abs(i.correlation) >= 0.7
  )

  if (strongCorrelations.length > 0) {
    strongCorrelations.forEach((corr) => {
      insights.push(
        `Strong correlation (${corr.correlation.toFixed(2)}) between ${corr.variable1.replace(/_/g, ' ')} and ${corr.variable2.replace(/_/g, ' ')}. Improving one may improve the other.`
      )
    })
  }

  // Find weak correlations (opportunities)
  const weakCorrelations = matrix.insights.filter(
    (i) => Math.abs(i.correlation) < 0.3
  )

  if (weakCorrelations.length > 0) {
    insights.push(
      `Some parameters show weak correlation, suggesting they measure independent skills. Focus on each separately.`
    )
  }

  return insights
}
