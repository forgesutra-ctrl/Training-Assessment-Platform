/**
 * Reporting Utilities
 * Functions for generating reports, exports, and analytics
 */

import { AssessmentWithDetails, TrainerWithStats, ASSESSMENT_STRUCTURE } from '@/types'
import { calculateCategoryAveragesAcrossAssessments } from '@/utils/trainerStats'
import ExcelJS from 'exceljs'

export interface ReportData {
  title: string
  generatedAt: string
  period: string
  data: any
  charts?: any[]
  insights?: string[]
}

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv' | 'json' | 'powerpoint'
  includeCharts: boolean
  includeInsights: boolean
  dateRange?: { start: string; end: string }
}

/**
 * Generate Excel export with multiple sheets
 */
export const exportToExcel = async (
  data: Record<string, any[]>,
  filename: string = 'report'
): Promise<void> => {
  const workbook = new ExcelJS.Workbook()

  Object.entries(data).forEach(([sheetName, sheetData]) => {
    const worksheet = workbook.addWorksheet(sheetName)
    
    if (sheetData.length > 0) {
      // Add headers
      const headers = Object.keys(sheetData[0])
      worksheet.addRow(headers)
      
      // Style header row
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      
      // Add data rows
      sheetData.forEach((row) => {
        worksheet.addRow(headers.map(header => row[header]))
      })
      
      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        if (column.header) {
          column.width = 15
        }
      })
    }
  })

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.xlsx`
  link.click()
}

/**
 * Generate CSV export
 */
export const exportToCSV = (data: any[], filename: string = 'report'): void => {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }
  
  // Get headers from first row
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (value == null) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ]
  
  const csv = csvRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

/**
 * Generate JSON export
 */
export const exportToJSON = (data: any, filename: string = 'report'): void => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.json`
  link.click()
}

/**
 * Calculate platform metrics for executive dashboard
 */
export const calculatePlatformMetrics = (assessments: AssessmentWithDetails[]) => {
  if (assessments.length === 0) {
    return {
      overallEffectiveness: 0,
      trainerCompetencyIndex: 0,
      assessmentCoverageRate: 0,
      trendDirection: 'stable' as const,
      yoyComparison: 0,
    }
  }

  // Overall effectiveness (average of all assessments)
  const overallEffectiveness =
    assessments.reduce((sum, a) => sum + a.average_score, 0) / assessments.length

  // Trainer competency index (weighted average)
  const trainerCompetencyIndex = overallEffectiveness * 20 // Scale to 0-100

  // Assessment coverage (would need trainer count - simplified)
  const assessmentCoverageRate = 100 // Placeholder

  // Trend direction (compare last month vs previous month)
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  const lastMonthAssessments = assessments.filter(
    (a) => new Date(a.assessment_date) >= lastMonth
  )
  const previousMonthAssessments = assessments.filter(
    (a) => {
      const date = new Date(a.assessment_date)
      return date >= previousMonth && date < lastMonth
    }
  )

  const lastMonthAvg =
    lastMonthAssessments.length > 0
      ? lastMonthAssessments.reduce((sum, a) => sum + a.average_score, 0) /
        lastMonthAssessments.length
      : 0
  const previousMonthAvg =
    previousMonthAssessments.length > 0
      ? previousMonthAssessments.reduce((sum, a) => sum + a.average_score, 0) /
        previousMonthAssessments.length
      : 0

  let trendDirection: 'up' | 'down' | 'stable' = 'stable'
  if (lastMonthAvg > previousMonthAvg + 0.1) trendDirection = 'up'
  else if (lastMonthAvg < previousMonthAvg - 0.1) trendDirection = 'down'

  // YoY comparison (simplified - would need year-ago data)
  const yoyComparison = 0

  return {
    overallEffectiveness: Number(overallEffectiveness.toFixed(2)),
    trainerCompetencyIndex: Number(trainerCompetencyIndex.toFixed(1)),
    assessmentCoverageRate,
    trendDirection,
    yoyComparison,
  }
}

/**
 * Identify high-impact improvement areas
 */
export const identifyImprovementAreas = (
  assessments: AssessmentWithDetails[]
): Array<{ parameter: string; currentAvg: number; potentialImpact: number }> => {
  const results: Array<{ parameter: string; currentAvg: number; potentialImpact: number }> = []

  // Check all 21 parameters
  ASSESSMENT_STRUCTURE.categories.forEach((category) => {
    category.parameters.forEach((param) => {
      const scores = assessments.map((a: any) => a[param.id] as number | null).filter((s): s is number => s !== null && s > 0)
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      // Potential impact = how much room for improvement (5.0 - current)
      const potentialImpact = 5.0 - avg

      results.push({
        parameter: `${category.name} - ${param.label}`,
        currentAvg: Number(avg.toFixed(2)),
        potentialImpact: Number(potentialImpact.toFixed(2)),
      })
    })
  })

  return results.sort((a, b) => b.potentialImpact - a.potentialImpact)
}

/**
 * Generate organizational capability heatmap data
 */
export const generateCapabilityHeatmap = (
  trainers: TrainerWithStats[],
  teams: Array<{ id: string; name: string }>
): Array<{ team: string; category: string; average: number }> => {
  const heatmapData: Array<{ team: string; category: string; average: number }> = []

  teams.forEach((team) => {
    const teamTrainers = trainers.filter((t) => t.team_name === team.name)
    if (teamTrainers.length === 0) return

    // Use category averages instead of individual parameters
    ASSESSMENT_STRUCTURE.categories.forEach((category) => {
      // For now, use overall average as proxy for category average
      // In a full implementation, you'd fetch actual assessments and calculate category averages
      const avg = teamTrainers.reduce((sum, t) => sum + (t.all_time_avg || 0), 0) / teamTrainers.length
      heatmapData.push({
        team: team.name,
        category: category.name,
        average: Number(avg.toFixed(2)),
      })
    })
  })

  return heatmapData
}

/**
 * Identify risk indicators
 */
export const identifyRiskIndicators = (
  assessments: AssessmentWithDetails[]
): Array<{ area: string; riskLevel: 'high' | 'medium' | 'low'; description: string }> => {
  const risks: Array<{ area: string; riskLevel: 'high' | 'medium' | 'low'; description: string }> = []

  // Check for declining trends
  const recent = assessments.slice(0, 10)
  const older = assessments.slice(10, 20)

  if (recent.length > 0 && older.length > 0) {
    const recentAvg = recent.reduce((sum, a) => sum + a.average_score, 0) / recent.length
    const olderAvg = older.reduce((sum, a) => sum + a.average_score, 0) / older.length

    if (recentAvg < olderAvg - 0.3) {
      risks.push({
        area: 'Overall Performance',
        riskLevel: 'high',
        description: `Performance declined from ${olderAvg.toFixed(2)} to ${recentAvg.toFixed(2)}`,
      })
    }
  }

  // Check for low scores
  const lowScores = assessments.filter((a) => a.average_score < 3.0)
  if (lowScores.length > assessments.length * 0.2) {
    risks.push({
      area: 'Low Performance Assessments',
      riskLevel: 'medium',
      description: `${((lowScores.length / assessments.length) * 100).toFixed(1)}% of assessments below 3.0`,
    })
  }

  return risks
}

/**
 * Generate PDF (using browser print functionality)
 */
export const exportToPDF = (elementId: string, filename: string = 'report'): void => {
  const element = document.getElementById(elementId)
  if (!element) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          @media print { @page { size: A4; margin: 1cm; } }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}
