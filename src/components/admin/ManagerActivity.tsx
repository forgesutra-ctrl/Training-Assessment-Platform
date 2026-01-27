import { useState, useEffect } from 'react'
import { Activity, Calendar, Users, BarChart3 } from 'lucide-react'
import { fetchManagerActivity, getCrossAssessmentMatrix } from '@/utils/adminQueries'
import { ManagerActivity as ManagerActivityType, CrossAssessmentMatrix } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const ManagerActivity = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [managers, setManagers] = useState<ManagerActivityType[]>([])
  const [matrix, setMatrix] = useState<CrossAssessmentMatrix[]>([])
  const [selectedManager, setSelectedManager] = useState<ManagerActivityType | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [managerData, matrixData] = await Promise.all([
          fetchManagerActivity(),
          getCrossAssessmentMatrix(),
        ])
        setManagers(managerData || [])
        setMatrix(matrixData || [])
      } catch (error: any) {
        console.error('Error loading manager activity:', error)
        const errorMessage = error?.message || 'Failed to load manager activity data'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []) // Component remounts when tab switches due to key prop

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const getRatingDistribution = (managerId: string) => {
    // This would need to fetch actual assessments for the manager
    // For now, return placeholder data
    return [
      { rating: '1', count: 0 },
      { rating: '2', count: 0 },
      { rating: '3', count: 2 },
      { rating: '4', count: 5 },
      { rating: '5', count: 3 },
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading manager activity data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Manager Activity Table */}
      <div className="card overflow-x-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Manager Activity Overview</h3>
        </div>

        {managers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No manager data available</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  This Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  This Quarter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  This Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  All-Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Rating Given
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Trainers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {managers.map((manager) => (
                <tr
                  key={manager.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    manager.activity_status === 'inactive' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{manager.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{manager.team_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manager.assessments_this_month}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manager.assessments_this_quarter}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manager.assessments_this_year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {manager.all_time_total}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {manager.avg_rating_given > 0 ? manager.avg_rating_given.toFixed(2) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manager.unique_trainers_assessed}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{formatDate(manager.last_assessment_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        manager.activity_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {manager.activity_status === 'active' ? (
                        <>
                          <Activity className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cross-Assessment Matrix */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Cross-Team Assessment Matrix</h3>
        {matrix.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No matrix data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  {Object.keys(matrix[0]?.team_assessments || {}).map((team) => (
                    <th
                      key={team}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {team}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matrix.map((row) => (
                  <tr key={row.manager_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.manager_name}
                    </td>
                    {Object.entries(row.team_assessments).map(([team, count]) => (
                      <td key={team} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {count > 0 ? (
                          <span className="font-semibold text-primary-600">{count}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagerActivity
