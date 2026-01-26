/**
 * Trend Detection & Analysis
 * Automatically detect patterns and generate alerts
 */

import { AssessmentWithDetails, TrainerAssessmentWithDetails } from '@/types'

export interface TrendAlert {
  id: string
  type: 'declining' | 'improving' | 'inconsistent' | 'skill_gap' | 'inactivity'
  severity: 'low' | 'medium' | 'high'
  message: string
  trainerId?: string
  managerId?: string
  parameter?: string
  data?: any
  createdAt: string
}

export interface TrendPattern {
  type: string
  description: string
  confidence: number
  data: any
}

/**
 * Detect declining performance (3 consecutive lower ratings)
 */
export const detectDecliningTrend = (
  assessments: TrainerAssessmentWithDetails[]
): TrendPattern | null => {
  if (assessments.length < 3) return null

  const recent = assessments.slice(0, 3)
  const scores = recent.map((a) => a.average_score).reverse()

  // Check if scores are decreasing
  let declining = true
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] >= scores[i - 1]) {
      declining = false
      break
    }
  }

  if (declining) {
    const decline = scores[0] - scores[scores.length - 1]
    return {
      type: 'declining',
      description: `Performance declining: ${scores[scores.length - 1].toFixed(2)} → ${scores[0].toFixed(2)}`,
      confidence: decline > 0.5 ? 0.9 : 0.7,
      data: { scores, decline },
    }
  }

  return null
}

/**
 * Detect rapid improvement (3 consecutive higher ratings)
 */
export const detectImprovingTrend = (
  assessments: TrainerAssessmentWithDetails[]
): TrendPattern | null => {
  if (assessments.length < 3) return null

  const recent = assessments.slice(0, 3)
  const scores = recent.map((a) => a.average_score).reverse()

  // Check if scores are increasing
  let improving = true
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] <= scores[i - 1]) {
      improving = false
      break
    }
  }

  if (improving) {
    const improvement = scores[scores.length - 1] - scores[0]
    return {
      type: 'improving',
      description: `Rapid improvement: ${scores[0].toFixed(2)} → ${scores[scores.length - 1].toFixed(2)}`,
      confidence: improvement > 0.5 ? 0.9 : 0.7,
      data: { scores, improvement },
    }
  }

  return null
}

/**
 * Detect inconsistent assessments (high variance)
 */
export const detectInconsistency = (
  assessments: TrainerAssessmentWithDetails[]
): TrendPattern | null => {
  if (assessments.length < 5) return null

  const scores = assessments.slice(0, 10).map((a) => a.average_score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)

  // High variance indicates inconsistency
  if (stdDev > 0.8) {
    return {
      type: 'inconsistent',
      description: `High variance in scores (std dev: ${stdDev.toFixed(2)})`,
      confidence: stdDev > 1.0 ? 0.9 : 0.7,
      data: { mean, stdDev, scores },
    }
  }

  return null
}

/**
 * Detect skill gaps (one parameter consistently low)
 */
export const detectSkillGap = (
  assessments: TrainerAssessmentWithDetails[]
): TrendPattern[] => {
  if (assessments.length < 3) return []

  const parameters = [
    'trainers_readiness',
    'communication_skills',
    'domain_expertise',
    'knowledge_displayed',
    'people_management',
    'technical_skills',
  ]

  const gaps: TrendPattern[] = []

  parameters.forEach((param) => {
    const scores = assessments.map((a: any) => a[param]).filter(Boolean)
    if (scores.length < 3) return

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const allLow = scores.every((s) => s < 3.0)

    if (avg < 2.5 || allLow) {
      gaps.push({
        type: 'skill_gap',
        description: `${param.replace(/_/g, ' ')} consistently low (avg: ${avg.toFixed(2)})`,
        confidence: avg < 2.0 ? 0.9 : 0.7,
        data: { parameter: param, average: avg, scores },
      })
    }
  })

  return gaps
}

/**
 * Generate trend alerts for a trainer
 */
export const generateTrendAlerts = (
  trainerId: string,
  assessments: TrainerAssessmentWithDetails[]
): TrendAlert[] => {
  const alerts: TrendAlert[] = []

  // Check for declining trend
  const declining = detectDecliningTrend(assessments)
  if (declining) {
    alerts.push({
      id: `declining-${trainerId}`,
      type: 'declining',
      severity: declining.data.decline > 1.0 ? 'high' : 'medium',
      message: `Declining performance detected: ${declining.description}`,
      trainerId,
      data: declining.data,
      createdAt: new Date().toISOString(),
    })
  }

  // Check for improving trend (positive alert)
  const improving = detectImprovingTrend(assessments)
  if (improving) {
    alerts.push({
      id: `improving-${trainerId}`,
      type: 'improving',
      severity: 'low',
      message: `Rapid improvement detected: ${improving.description}`,
      trainerId,
      data: improving.data,
      createdAt: new Date().toISOString(),
    })
  }

  // Check for inconsistency
  const inconsistent = detectInconsistency(assessments)
  if (inconsistent) {
    alerts.push({
      id: `inconsistent-${trainerId}`,
      type: 'inconsistent',
      severity: 'medium',
      message: `Inconsistent performance: ${inconsistent.description}`,
      trainerId,
      data: inconsistent.data,
      createdAt: new Date().toISOString(),
    })
  }

  // Check for skill gaps
  const gaps = detectSkillGap(assessments)
  gaps.forEach((gap, index) => {
    alerts.push({
      id: `gap-${trainerId}-${index}`,
      type: 'skill_gap',
      severity: gap.data.average < 2.0 ? 'high' : 'medium',
      message: `Skill gap detected: ${gap.description}`,
      trainerId,
      parameter: gap.data.parameter,
      data: gap.data,
      createdAt: new Date().toISOString(),
    })
  })

  return alerts
}

/**
 * Detect manager inactivity
 */
export const detectManagerInactivity = (
  managerId: string,
  lastAssessmentDate: string | null,
  daysThreshold: number = 30
): TrendAlert | null => {
  if (!lastAssessmentDate) {
    return {
      id: `inactivity-${managerId}`,
      type: 'inactivity',
      severity: 'medium',
      message: 'No assessments submitted yet',
      managerId,
      createdAt: new Date().toISOString(),
    }
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(lastAssessmentDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSince > daysThreshold) {
    return {
      id: `inactivity-${managerId}`,
      type: 'inactivity',
      severity: daysSince > 60 ? 'high' : 'medium',
      message: `No assessments in ${daysSince} days`,
      managerId,
      data: { daysSince, lastAssessmentDate },
      createdAt: new Date().toISOString(),
    }
  }

  return null
}

/**
 * Detect platform-wide trends
 */
export const detectPlatformTrends = (assessments: AssessmentWithDetails[]): TrendAlert[] => {
  const alerts: TrendAlert[] = []

  // Group by month
  const monthlyData: Record<string, number[]> = {}
  assessments.forEach((a) => {
    const month = new Date(a.assessment_date).toISOString().slice(0, 7)
    if (!monthlyData[month]) monthlyData[month] = []
    monthlyData[month].push(a.average_score)
  })

  const months = Object.keys(monthlyData).sort()
  if (months.length >= 2) {
    const recent = monthlyData[months[months.length - 1]]
    const previous = monthlyData[months[months.length - 2]]

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length

    const change = ((recentAvg - previousAvg) / previousAvg) * 100

    if (change < -10) {
      alerts.push({
        id: 'platform-declining',
        type: 'declining',
        severity: 'high',
        message: `Platform-wide average dropped ${Math.abs(change).toFixed(1)}% this month`,
        data: { recentAvg, previousAvg, change },
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Check parameter trends
  const parameters = [
    'trainers_readiness',
    'communication_skills',
    'domain_expertise',
    'knowledge_displayed',
    'people_management',
    'technical_skills',
  ]

  parameters.forEach((param) => {
    const recentScores = assessments
      .slice(0, 50)
      .map((a: any) => a[param])
      .filter(Boolean)
    if (recentScores.length < 10) return

    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    if (avg < 3.0) {
      alerts.push({
        id: `platform-${param}`,
        type: 'skill_gap',
        severity: 'medium',
        message: `${param.replace(/_/g, ' ')} scores below average (${avg.toFixed(2)})`,
        parameter: param,
        data: { average: avg },
        createdAt: new Date().toISOString(),
      })
    }
  })

  return alerts
}
