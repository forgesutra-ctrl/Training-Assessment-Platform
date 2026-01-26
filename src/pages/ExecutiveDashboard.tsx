import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Download, Share2, Lock, AlertTriangle } from 'lucide-react'
import { fetchPlatformStats, fetchMonthlyTrends } from '@/utils/adminQueries'
import { calculatePlatformMetrics, identifyImprovementAreas, identifyRiskIndicators, generateCapabilityHeatmap } from '@/utils/reporting'
import { fetchAllTrainersWithStats } from '@/utils/adminQueries'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import { ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const ExecutiveDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [riskIndicators, setRiskIndicators] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch all assessments
      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .order('assessment_date', { ascending: false })
        .limit(1000)

      // Fetch trainers and teams
      const trainers = await fetchAllTrainersWithStats('all-time')
      const { data: teams } = await supabase.from('teams').select('*')

      // Calculate metrics
      const platformMetrics = calculatePlatformMetrics(assessments || [])
      const improvementAreas = identifyImprovementAreas(assessments || [])
      const risks = identifyRiskIndicators(assessments || [])
      const heatmap = generateCapabilityHeatmap(trainers, teams || [])

      // Fetch monthly trends
      const trends = await fetchMonthlyTrends(12)

      // Generate insights
      const generatedInsights = [
        `Overall training effectiveness: ${platformMetrics.overallEffectiveness}/5.0`,
        `Top improvement opportunity: ${improvementAreas[0]?.parameter} (potential gain: ${improvementAreas[0]?.potentialImpact.toFixed(2)} points)`,
        `Trend direction: ${platformMetrics.trendDirection === 'up' ? 'Improving' : platformMetrics.trendDirection === 'down' ? 'Declining' : 'Stable'}`,
        risks.length > 0
          ? `${risks.length} risk indicator${risks.length > 1 ? 's' : ''} identified`
          : 'No significant risk indicators',
      ]

      setMetrics(platformMetrics)
      setInsights(generatedInsights)
      setRiskIndicators(risks)
      setHeatmapData(heatmap)
      setMonthlyTrend(trends)
    } catch (error: any) {
      console.error('Error loading executive dashboard:', error)
      toast.error('Failed to load executive dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    exportToPDF('executive-dashboard-content', 'Executive-Dashboard')
    toast.success('PDF export started')
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-6 h-6 text-green-600" />
      case 'down':
        return <TrendingDown className="w-6 h-6 text-red-600" />
      default:
        return <Minus className="w-6 h-6 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading executive dashboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Summary</h1>
            <p className="text-gray-600 mt-1">Strategic overview of training assessment platform</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
            <button
              onClick={() => toast.info('Share feature coming soon')}
              className="btn-secondary flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div id="executive-dashboard-content" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Overall Effectiveness</h3>
                {getTrendIcon(metrics?.trendDirection)}
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics?.overallEffectiveness || '0.00'}
              </div>
              <div className="text-sm text-gray-600">/ 5.00</div>
              {metrics?.yoyComparison !== 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  YoY: {metrics.yoyComparison > 0 ? '+' : ''}
                  {metrics.yoyComparison}%
                </div>
              )}
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Competency Index</h3>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics?.trainerCompetencyIndex || '0'}
              </div>
              <div className="text-sm text-gray-600">/ 100</div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Coverage Rate</h3>
                <Minus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics?.assessmentCoverageRate || '0'}%
              </div>
              <div className="text-sm text-gray-600">Trainers assessed</div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Trend Direction</h3>
                {getTrendIcon(metrics?.trendDirection)}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                {metrics?.trendDirection || 'Stable'}
              </div>
              <div className="text-sm text-gray-600">Performance trajectory</div>
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Improvement Areas */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Impact Improvement Areas</h3>
              <div className="space-y-3">
                {identifyImprovementAreas([]).slice(0, 5).map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{area.parameter}</div>
                      <div className="text-sm text-gray-600">
                        Current: {area.currentAvg}/5.0 • Potential: +{area.potentialImpact}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {((area.potentialImpact / 5.0) * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Impact</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Indicators */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Risk Indicators
              </h3>
              {riskIndicators.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>No significant risks identified</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riskIndicators.map((risk, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 ${
                        risk.riskLevel === 'high'
                          ? 'bg-red-50 border-red-300'
                          : risk.riskLevel === 'medium'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{risk.area}</div>
                          <div className="text-sm text-gray-700 mt-1">{risk.description}</div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.riskLevel === 'high'
                              ? 'bg-red-100 text-red-800'
                              : risk.riskLevel === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {risk.riskLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">12-Month Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              {/* Line chart would go here - using recharts */}
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Chart visualization (Recharts LineChart)
              </div>
            </ResponsiveContainer>
          </div>

          {/* Key Insights */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Insights</h3>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function for PDF export
const exportToPDF = (elementId: string, filename: string): void => {
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

export default ExecutiveDashboard
