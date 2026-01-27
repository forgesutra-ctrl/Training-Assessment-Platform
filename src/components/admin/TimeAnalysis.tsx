import { useState, useEffect } from 'react'
import { fetchMonthlyTrends, fetchQuarterlyData } from '@/utils/adminQueries'
import { MonthlyTrend, QuarterlyData } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'

const TimeAnalysis = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [trends, quarters] = await Promise.all([
          fetchMonthlyTrends(12),
          fetchQuarterlyData(),
        ])
        setMonthlyTrends(trends || [])
        setQuarterlyData(quarters || [])
      } catch (error: any) {
        console.error('Error loading time analysis data:', error)
        const errorMessage = error?.message || 'Failed to load time analysis data'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []) // Component remounts when tab switches due to key prop

  // Calculate month-over-month changes
  const getMonthChange = (index: number) => {
    if (index === 0) return null
    const current = monthlyTrends[index].average_rating
    const previous = monthlyTrends[index - 1].average_rating
    if (previous === 0) return null
    const change = ((current - previous) / previous) * 100
    return Number(change.toFixed(1))
  }

  // Separate current year and previous year quarters
  const currentYearQuarters = quarterlyData.filter((q) => q.year === new Date().getFullYear())
  const previousYearQuarters = quarterlyData.filter(
    (q) => q.year === new Date().getFullYear() - 1
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading time analysis data..." />
      </div>
    )
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Monthly Trends */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Average Rating Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis domain={[0, 5]} stroke="#6b7280" />
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
              dataKey="average_rating"
              name="Average Rating"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {monthlyTrends.slice(-4).map((trend, index) => {
            const actualIndex = monthlyTrends.length - 4 + index
            const change = getMonthChange(actualIndex)
            return (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-600">{trend.month}</p>
                <p className="text-lg font-bold text-gray-900">{trend.average_rating.toFixed(2)}</p>
                {change !== null && (
                  <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}
                    {change}%
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Assessment Volume */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Assessment Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="assessment_count" name="Assessments" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Parameter Trends */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Parameter Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis domain={[0, 5]} stroke="#6b7280" />
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
              dataKey="parameter_averages.trainers_readiness"
              name="Trainer's Readiness"
              stroke="#6366f1"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="parameter_averages.communication_skills"
              name="Communication Skills"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="parameter_averages.domain_expertise"
              name="Domain Expertise"
              stroke="#ec4899"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="parameter_averages.knowledge_displayed"
              name="Knowledge Displayed"
              stroke="#f59e0b"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="parameter_averages.people_management"
              name="People Management"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="parameter_averages.technical_skills"
              name="Technical Skills"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly Comparison */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quarterly Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={quarterlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="quarter" stroke="#6b7280" />
            <YAxis domain={[0, 5]} stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="average_rating" name="Average Rating" radius={[8, 8, 0, 0]}>
              {quarterlyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Year-over-Year Comparison */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Year-over-Year Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {new Date().getFullYear()}
            </h4>
            <div className="space-y-2">
              {currentYearQuarters.map((q) => (
                <div key={q.quarter} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{q.quarter}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {q.average_rating.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">({q.assessment_count} assessments)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {new Date().getFullYear() - 1}
            </h4>
            <div className="space-y-2">
              {previousYearQuarters.map((q) => (
                <div key={q.quarter} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{q.quarter}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {q.average_rating.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">({q.assessment_count} assessments)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeAnalysis
