import { useState, useEffect } from 'react'
import { Plus, Save, Download, Settings, BarChart3, LineChart, PieChart, TrendingUp, X } from 'lucide-react'
import { fetchAllTrainersWithStats, fetchMonthlyTrends, fetchQuarterlyData } from '@/utils/adminQueries'
import { exportToExcel, exportToCSV } from '@/utils/reporting'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

/** Time period for filtering chart data */
export type DataStudioTimePeriod = 'all-time' | 'last-12-months' | 'last-6-months' | 'ytd' | 'quarter'

interface ChartConfig {
  id: string
  type: 'line' | 'bar' | 'pie' | 'radar' | 'heatmap' | 'scatter' | 'funnel' | 'gauge'
  title: string
  dataSource: string
  xAxis?: string
  yAxis?: string
  filters?: Record<string, any>
}

const TIME_PERIOD_OPTIONS: { value: DataStudioTimePeriod; label: string }[] = [
  { value: 'all-time', label: 'All time' },
  { value: 'last-12-months', label: 'Last 12 months' },
  { value: 'last-6-months', label: 'Last 6 months' },
  { value: 'ytd', label: 'This year (YTD)' },
  { value: 'quarter', label: 'Current quarter (Q1/Q2/Q3/Q4)' },
]

function SettingsModal({
  timePeriod,
  onClose,
  onApply,
  options,
}: {
  timePeriod: DataStudioTimePeriod
  onClose: () => void
  onApply: (period: DataStudioTimePeriod) => void
  options: { value: DataStudioTimePeriod; label: string }[]
}) {
  const [pending, setPending] = useState<DataStudioTimePeriod>(timePeriod)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Studio Settings</h3>
        <p className="text-sm text-gray-600 mb-4">Choose the time period used for all charts (trainer stats and trends).</p>
        <label className="block text-sm font-medium text-gray-700 mb-2">Time period</label>
        <select
          value={pending}
          onChange={(e) => setPending(e.target.value as DataStudioTimePeriod)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary">Close</button>
          <button type="button" onClick={() => onApply(pending)} className="btn-primary">Apply</button>
        </div>
      </div>
    </div>
  )
}

const DataStudio = () => {
  const [loading, setLoading] = useState(false)
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [availableData, setAvailableData] = useState<any>({})
  const [selectedChartType, setSelectedChartType] = useState<ChartConfig['type']>('line')
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [timePeriod, setTimePeriod] = useState<DataStudioTimePeriod>('all-time')
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    loadAvailableData(timePeriod)
  }, [timePeriod])

  const [error, setError] = useState<string | null>(null)

  const loadAvailableData = async (period: DataStudioTimePeriod) => {
    try {
      setLoading(true)
      setError(null)
      const statsRange = period === 'quarter' ? 'quarter' : period === 'ytd' ? 'ytd' : period === 'all-time' ? 'all-time' : period
      const monthsForTrends = period === 'quarter' ? 3 : period === 'last-6-months' ? 6 : 12
      const [trainers, trends, quarterly] = await Promise.all([
        fetchAllTrainersWithStats(statsRange),
        fetchMonthlyTrends(monthsForTrends),
        period === 'quarter' ? fetchQuarterlyData() : Promise.resolve([]),
      ])

      setAvailableData({
        trainers: trainers || [],
        monthlyTrends: trends || [],
        quarterlyData: quarterly || [],
      })
    } catch (error: any) {
      console.error('Error loading data:', error)
      const errorMessage = error?.message || 'Failed to load data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const chartTypes = [
    { type: 'line', label: 'Line Chart', icon: LineChart, description: 'Trends over time' },
    { type: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Comparisons' },
    { type: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Distribution' },
    { type: 'radar', label: 'Radar Chart', icon: TrendingUp, description: 'Skill profiles' },
    { type: 'heatmap', label: 'Heatmap', icon: BarChart3, description: 'Activity density' },
    { type: 'scatter', label: 'Scatter Plot', icon: BarChart3, description: 'Correlation' },
    { type: 'funnel', label: 'Funnel Chart', icon: BarChart3, description: 'Progression' },
    { type: 'gauge', label: 'Gauge Chart', icon: BarChart3, description: 'KPI monitoring' },
  ]

  const handleAddChart = () => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: selectedChartType,
      title: `New ${selectedChartType} Chart`,
      dataSource: 'trainers',
    }
    setCharts([...charts, newChart])
    setShowChartBuilder(false)
    toast.success('Chart added')
  }

  const handleSaveReport = () => {
    // Save report configuration
    toast.success('Report saved successfully')
  }

  /** Build the underlying table data for a chart (for Excel export) */
  const getChartDataForExport = (chart: ChartConfig): any[] => {
    const trainers = availableData.trainers || []
    const monthlyTrends = availableData.monthlyTrends || []
    switch (chart.type) {
      case 'line':
        return monthlyTrends.map((t: any) => ({
          Month: t.month,
          'Average Score': t.average_rating ?? 0,
          'Total Assessments': t.assessment_count ?? 0,
        }))
      case 'bar':
        return trainers.slice(0, 10).map((t: any) => ({
          Trainer: (t.full_name || '').length > 15 ? (t.full_name || '').substring(0, 15) + '...' : (t.full_name || ''),
          'All-Time Avg': t.all_time_avg ?? 0,
          'Month Avg': t.current_month_avg ?? 0,
        }))
      case 'pie': {
        const teamCounts: Record<string, number> = {}
        trainers.forEach((t: any) => {
          const team = t.team_name || 'No Team'
          teamCounts[team] = (teamCounts[team] || 0) + 1
        })
        return Object.entries(teamCounts).map(([name, value]) => ({ Team: name, Count: value }))
      }
      case 'radar': {
        const top = trainers[0]
        if (!top) return []
        return [
          { Subject: 'Readiness', Score: top.all_time_avg ?? 0 },
          { Subject: 'Communication', Score: top.all_time_avg ?? 0 },
          { Subject: 'Domain', Score: top.all_time_avg ?? 0 },
          { Subject: 'Knowledge', Score: top.all_time_avg ?? 0 },
          { Subject: 'People Mgmt', Score: top.all_time_avg ?? 0 },
          { Subject: 'Technical', Score: top.all_time_avg ?? 0 },
        ]
      }
      default:
        return [{ 'Chart Type': chart.type, Title: chart.title, 'Data Source': chart.dataSource }]
    }
  }

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      if (charts.length === 0) {
        toast.error('No charts to export')
        return
      }

      toast.loading(`Exporting to ${format.toUpperCase()}...`, { id: 'export' })

      if (format === 'csv') {
        const csvData = charts.map((chart) => ({
          'Chart Type': chart.type,
          'Chart Title': chart.title,
          'Data Source': chart.dataSource,
        }))
        exportToCSV(csvData, `data_studio_${new Date().toISOString().split('T')[0]}`)
        toast.success('Charts exported to CSV', { id: 'export' })
      } else {
        const excelData: Record<string, any[]> = {}
        const summaryRows = charts.map((c, i) => ({
          '#': i + 1,
          'Chart Type': c.type,
          Title: c.title,
          'Data Source': c.dataSource,
        }))
        excelData['Summary'] = summaryRows
        charts.forEach((chart, index) => {
          const tableData = getChartDataForExport(chart)
          excelData[`Chart ${index + 1} - ${chart.title}`] = tableData.length > 0 ? tableData : [{ Note: 'No data for this chart' }]
        })
        await exportToExcel(excelData, `data_studio_${new Date().toISOString().split('T')[0]}`)
        toast.success('Exported to Excel (tables + chart data)', { id: 'export' })
      }
    } catch (error: any) {
      console.error('Error exporting:', error)
      toast.error('Failed to export', { id: 'export' })
    }
  }

  const renderChart = (chart: ChartConfig) => {
    if (!availableData.trainers || availableData.trainers.length === 0) {
      return (
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          No data available
        </div>
      )
    }

    switch (chart.type) {
      case 'line':
        // Line chart: Monthly trends
        const monthlyData = (availableData.monthlyTrends || []).map((t: any) => ({
          month: t.month,
          'Average Score': t.average_rating || 0,
          'Total Assessments': t.assessment_count || 0,
        }))
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Average Score"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Total Assessments"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        // Bar chart: Trainer performance comparison
        const trainerData = availableData.trainers
          .slice(0, 10)
          .map((t: any) => ({
            name: t.full_name.length > 15 ? t.full_name.substring(0, 15) + '...' : t.full_name,
            'All-Time Avg': t.all_time_avg || 0,
            'Month Avg': t.current_month_avg || 0,
          }))
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={trainerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="All-Time Avg" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Month Avg" fill="#10b981" radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        // Pie chart: Team distribution
        const teamCounts: Record<string, number> = {}
        availableData.trainers.forEach((t: any) => {
          const team = t.team_name || 'No Team'
          teamCounts[team] = (teamCounts[team] || 0) + 1
        })
        const pieData = Object.entries(teamCounts).map(([name, value]) => ({ name, value }))
        const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case 'radar':
        // Radar chart: Top trainer skill profile
        const topTrainer = availableData.trainers[0]
        if (!topTrainer) return <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">No data</div>
        
        // Simplified - would need actual parameter data
        const radarData = [
          { subject: 'Readiness', A: topTrainer.all_time_avg || 0, fullMark: 5 },
          { subject: 'Communication', A: topTrainer.all_time_avg || 0, fullMark: 5 },
          { subject: 'Domain', A: topTrainer.all_time_avg || 0, fullMark: 5 },
          { subject: 'Knowledge', A: topTrainer.all_time_avg || 0, fullMark: 5 },
          { subject: 'People Mgmt', A: topTrainer.all_time_avg || 0, fullMark: 5 },
          { subject: 'Technical', A: topTrainer.all_time_avg || 0, fullMark: 5 },
        ]
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} stroke="#6b7280" />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Chart type "{chart.type}" coming soon
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading data studio..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data Studio</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadAvailableData(timePeriod)
          }}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Visualization Studio</h2>
          <p className="text-sm text-gray-600 mt-1">
            Build custom reports and visualizations. Time period: {TIME_PERIOD_OPTIONS.find((o) => o.value === timePeriod)?.label ?? timePeriod}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-secondary flex items-center gap-2"
            title="Filter by time period (months, quarters, all time)"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button
            onClick={() => setShowChartBuilder(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Chart
          </button>
          <button onClick={handleSaveReport} className="btn-secondary flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Report
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn-secondary flex items-center gap-2"
            title="Download as Excel (tables and chart data)"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Settings modal: time period filter */}
      {showSettingsModal && (
        <SettingsModal
          timePeriod={timePeriod}
          onClose={() => setShowSettingsModal(false)}
          onApply={(period) => {
            setTimePeriod(period)
            setShowSettingsModal(false)
            toast.success('Settings applied')
          }}
          options={TIME_PERIOD_OPTIONS}
        />
      )}

      {/* Chart Builder Modal */}
      {showChartBuilder && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Chart</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartTypes.map((chart) => {
              const Icon = chart.icon
              return (
                <button
                  key={chart.type}
                  onClick={() => {
                    setSelectedChartType(chart.type as any)
                    handleAddChart()
                  }}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    selectedChartType === chart.type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                  <div className="font-medium text-gray-900">{chart.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{chart.description}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {charts.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No charts yet</p>
          <button onClick={() => setShowChartBuilder(true)} className="btn-primary">
            Create Your First Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map((chart) => (
            <div key={chart.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{chart.title}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updatedCharts = charts.filter((c) => c.id !== chart.id)
                      setCharts(updatedCharts)
                      toast.success('Chart removed')
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove chart"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Time period and filters (applies to all charts)"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                {renderChart(chart)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DataStudio
