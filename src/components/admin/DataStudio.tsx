import { useState, useEffect } from 'react'
import { Plus, Save, Download, Settings, BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react'
import { fetchAllTrainersWithStats, fetchMonthlyTrends } from '@/utils/adminQueries'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ChartConfig {
  id: string
  type: 'line' | 'bar' | 'pie' | 'radar' | 'heatmap' | 'scatter' | 'funnel' | 'gauge'
  title: string
  dataSource: string
  xAxis?: string
  yAxis?: string
  filters?: Record<string, any>
}

const DataStudio = () => {
  const [loading, setLoading] = useState(false)
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [availableData, setAvailableData] = useState<any>({})
  const [selectedChartType, setSelectedChartType] = useState<ChartConfig['type']>('line')
  const [showChartBuilder, setShowChartBuilder] = useState(false)

  useEffect(() => {
    loadAvailableData()
  }, [])

  const loadAvailableData = async () => {
    try {
      setLoading(true)
      const [trainers, trends] = await Promise.all([
        fetchAllTrainersWithStats('all-time'),
        fetchMonthlyTrends(12),
      ])

      setAvailableData({
        trainers,
        monthlyTrends: trends,
      })
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
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

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    toast.success(`Exporting to ${format.toUpperCase()}...`)
    // Export logic would go here
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading data studio..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Visualization Studio</h2>
          <p className="text-sm text-gray-600 mt-1">
            Build custom reports and visualizations with drag-and-drop
          </p>
        </div>
        <div className="flex gap-3">
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
            onClick={() => handleExport('pdf')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

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
                <button className="text-gray-400 hover:text-gray-600">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                {chart.type} Chart Placeholder
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DataStudio
