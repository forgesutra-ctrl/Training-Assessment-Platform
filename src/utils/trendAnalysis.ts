/**
 * Trend Detection & Analysis
 * Data-backed alerts with full context for admin drill-down
 */

import { AssessmentWithDetails, TrainerAssessmentWithDetails, ASSESSMENT_STRUCTURE } from '@/types'

/** Category IDs for 21-parameter schema (skill-gap detection) */
const CATEGORY_IDS = ['trainer_readiness', 'expertise_delivery', 'engagement_interaction', 'communication', 'technical_acumen'] as const

/** Human-readable category label */
function getCategoryLabel(categoryId: string): string {
  const cat = ASSESSMENT_STRUCTURE.categories.find((c) => c.id === categoryId)
  return cat?.name ?? categoryId.replace(/_/g, ' ')
}

/** Average score for one category on one assessment (21-param schema) */
function getCategoryAverage(assessment: any, categoryId: string): number | null {
  const cat = ASSESSMENT_STRUCTURE.categories.find((c) => c.id === categoryId)
  if (!cat) return null
  let sum = 0
  let count = 0
  cat.parameters.forEach((p) => {
    const v = assessment[p.id]
    if (v != null && typeof v === 'number' && v > 0) {
      sum += v
      count++
    }
  })
  return count > 0 ? sum / count : null
}

/** Enriched alert payload for UI (period, scores table, metrics) */
export interface TrendAlertData {
  periodStart?: string
  periodEnd?: string
  assessmentCount?: number
  scoresWithDates?: { date: string; score: number; assessmentId?: string }[]
  mean?: number
  stdDev?: number
  minScore?: number
  maxScore?: number
  decline?: number
  improvement?: number
  scores?: number[]
  parameter?: string
  parameterLabel?: string
  average?: number
  daysSince?: number
  lastAssessmentDate?: string | null
  [key: string]: any
}

export interface TrendAlert {
  id: string
  type: 'declining' | 'improving' | 'inconsistent' | 'skill_gap' | 'inactivity'
  severity: 'low' | 'medium' | 'high'
  message: string
  trainerId?: string
  managerId?: string
  trainerName?: string
  managerName?: string
  parameter?: string
  parameterLabel?: string
  data?: TrendAlertData
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
  const scoresWithDates = recent.map((a) => ({
    date: a.assessment_date,
    score: a.average_score,
    assessmentId: a.id,
  })).reverse()

  let declining = true
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] >= scores[i - 1]) {
      declining = false
      break
    }
  }

  if (declining) {
    const decline = scores[0] - scores[scores.length - 1]
    const periodStart = recent[recent.length - 1]?.assessment_date
    const periodEnd = recent[0]?.assessment_date
    return {
      type: 'declining',
      description: `Performance declining: ${scores[scores.length - 1].toFixed(2)} → ${scores[0].toFixed(2)} over last 3 assessments`,
      confidence: decline > 0.5 ? 0.9 : 0.7,
      data: {
        scores,
        decline,
        scoresWithDates,
        periodStart,
        periodEnd,
        assessmentCount: recent.length,
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
        mean: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      },
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
  const scoresWithDates = recent.map((a) => ({
    date: a.assessment_date,
    score: a.average_score,
    assessmentId: a.id,
  })).reverse()

  let improving = true
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] <= scores[i - 1]) {
      improving = false
      break
    }
  }

  if (improving) {
    const improvement = scores[scores.length - 1] - scores[0]
    const periodStart = recent[recent.length - 1]?.assessment_date
    const periodEnd = recent[0]?.assessment_date
    return {
      type: 'improving',
      description: `Rapid improvement: ${scores[0].toFixed(2)} → ${scores[scores.length - 1].toFixed(2)} over last 3 assessments`,
      confidence: improvement > 0.5 ? 0.9 : 0.7,
      data: {
        scores,
        improvement,
        scoresWithDates,
        periodStart,
        periodEnd,
        assessmentCount: recent.length,
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
        mean: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      },
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

  const recent = assessments.slice(0, 10)
  const scores = recent.map((a) => a.average_score)
  const mean = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
  const stdDev = Number(Math.sqrt(variance).toFixed(2))
  const scoresWithDates = recent.map((a) => ({
    date: a.assessment_date,
    score: a.average_score,
    assessmentId: a.id,
  }))
  const periodStart = recent[recent.length - 1]?.assessment_date
  const periodEnd = recent[0]?.assessment_date

  if (stdDev > 0.8) {
    return {
      type: 'inconsistent',
      description: `High variance in last ${scores.length} assessments (std dev: ${stdDev}; range ${Math.min(...scores).toFixed(2)}–${Math.max(...scores).toFixed(2)})`,
      confidence: stdDev > 1.0 ? 0.9 : 0.7,
      data: {
        mean,
        stdDev,
        scores,
        scoresWithDates,
        periodStart,
        periodEnd,
        assessmentCount: scores.length,
        minScore: Number(Math.min(...scores).toFixed(2)),
        maxScore: Number(Math.max(...scores).toFixed(2)),
      },
    }
  }

  return null
}

/**
 * Detect skill gaps (one category consistently low; 21-param schema)
 */
export const detectSkillGap = (
  assessments: TrainerAssessmentWithDetails[]
): TrendPattern[] => {
  if (assessments.length < 3) return []

  const gaps: TrendPattern[] = []

  CATEGORY_IDS.forEach((categoryId) => {
    const categoryScores: number[] = []
    assessments.slice(0, 10).forEach((a: any) => {
      const catAvg = getCategoryAverage(a, categoryId)
      if (catAvg != null) categoryScores.push(catAvg)
    })
    if (categoryScores.length < 3) return

    const avg = Number((categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length).toFixed(2))
    const allLow = categoryScores.every((s) => s < 3.0)

    if (avg < 2.5 || allLow) {
      const recent = assessments.slice(0, 10)
      const periodStart = recent[recent.length - 1]?.assessment_date
      const periodEnd = recent[0]?.assessment_date
      const scoresWithDates = recent.map((a) => {
        const v = getCategoryAverage(a, categoryId)
        return { date: a.assessment_date, score: v ?? 0, assessmentId: a.id }
      }).filter((d) => d.score > 0)

      gaps.push({
        type: 'skill_gap',
        description: `${getCategoryLabel(categoryId)} consistently low (avg: ${avg.toFixed(2)}/5 across ${categoryScores.length} assessments)`,
        confidence: avg < 2.0 ? 0.9 : 0.7,
        data: {
          parameter: categoryId,
          parameterLabel: getCategoryLabel(categoryId),
          average: avg,
          scores: categoryScores,
          scoresWithDates: scoresWithDates.length ? scoresWithDates : undefined,
          periodStart,
          periodEnd,
          assessmentCount: categoryScores.length,
          minScore: Math.min(...categoryScores),
          maxScore: Math.max(...categoryScores),
        },
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

  // Check for skill gaps (21-param categories)
  const gaps = detectSkillGap(assessments)
  gaps.forEach((gap, index) => {
    alerts.push({
      id: `gap-${trainerId}-${index}`,
      type: 'skill_gap',
      severity: gap.data.average < 2.0 ? 'high' : 'medium',
      message: `Skill gap: ${gap.description}`,
      trainerId,
      parameter: gap.data.parameter,
      parameterLabel: gap.data.parameterLabel,
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
      data: { daysSince: null, lastAssessmentDate: null },
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
      message: `No assessments submitted in ${daysSince} days (last: ${new Date(lastAssessmentDate).toLocaleDateString()})`,
      managerId,
      data: { daysSince, lastAssessmentDate, periodEnd: lastAssessmentDate },
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

  // Check category trends (21-param schema)
  CATEGORY_IDS.forEach((categoryId) => {
    const recentScores: number[] = []
    assessments.slice(0, 50).forEach((a: any) => {
      const v = getCategoryAverage(a, categoryId)
      if (v != null) recentScores.push(v)
    })
    if (recentScores.length < 10) return

    const avg = Number((recentScores.reduce((a, b) => a + b, 0) / recentScores.length).toFixed(2))
    if (avg < 3.0) {
      alerts.push({
        id: `platform-${categoryId}`,
        type: 'skill_gap',
        severity: 'medium',
        message: `Platform: ${getCategoryLabel(categoryId)} scores below average (${avg.toFixed(2)}/5)`,
        parameter: categoryId,
        parameterLabel: getCategoryLabel(categoryId),
        data: { average: avg, assessmentCount: recentScores.length },
        createdAt: new Date().toISOString(),
      })
    }
  })

  return alerts
}
