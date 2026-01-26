import { useState, useEffect, useMemo } from 'react'
import { Search, TrendingUp, TrendingDown, Eye, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { fetchAllTrainersWithStats } from '@/utils/adminQueries'
import { TrainerWithStats } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

type SortField = keyof TrainerWithStats
type SortDirection = 'asc' | 'desc'

const TrainerPerformance = () => {
  const [loading, setLoading] = useState(true)
  const [trainers, setTrainers] = useState<TrainerWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'ytd' | 'all-time'>('all-time')
  const [sortField, setSortField] = useState<SortField>('all_time_avg')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchAllTrainersWithStats(dateRange)
        setTrainers(data)
      } catch (error: any) {
        console.error('Error loading trainer data:', error)
        toast.error('Failed to load trainer performance data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  // Get unique teams for filter
  const teams = useMemo(() => {
    const uniqueTeams = new Set(trainers.map((t) => t.team_name).filter(Boolean))
    return Array.from(uniqueTeams).sort()
  }, [trainers])

  // Filter and sort trainers
  const filteredAndSorted = useMemo(() => {
    let filtered = trainers.filter((trainer) => {
      const matchesSearch =
        trainer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trainer.team_name && trainer.team_name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesTeam = !teamFilter || trainer.team_name === teamFilter
      return matchesSearch && matchesTeam
    })

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return 0
    })

    return filtered
  }, [trainers, searchTerm, teamFilter, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedTrainers = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading trainer performance data..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search by name or team..."
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
            <select
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input-field"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as any)
                setCurrentPage(1)
              }}
              className="input-field"
            >
              <option value="month">Current Month</option>
              <option value="quarter">Current Quarter</option>
              <option value="ytd">Year to Date</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Trainer Performance ({filteredAndSorted.length} trainers)
          </h3>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No trainers found matching your filters</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center gap-2">
                      Trainer Name
                      <SortIcon field="full_name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('team_name')}
                  >
                    <div className="flex items-center gap-2">
                      Team
                      <SortIcon field="team_name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('current_month_avg')}
                  >
                    <div className="flex items-center gap-2">
                      Month Avg
                      <SortIcon field="current_month_avg" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quarter_avg')}
                  >
                    <div className="flex items-center gap-2">
                      Quarter Avg
                      <SortIcon field="quarter_avg" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ytd_avg')}
                  >
                    <div className="flex items-center gap-2">
                      YTD Avg
                      <SortIcon field="ytd_avg" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('all_time_avg')}
                  >
                    <div className="flex items-center gap-2">
                      All-Time Avg
                      <SortIcon field="all_time_avg" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_assessments')}
                  >
                    <div className="flex items-center gap-2">
                      Total
                      <SortIcon field="total_assessments" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTrainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{trainer.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{trainer.team_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getScoreColor(trainer.current_month_avg)}`}>
                        {trainer.current_month_avg > 0 ? trainer.current_month_avg.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getScoreColor(trainer.quarter_avg)}`}>
                        {trainer.quarter_avg > 0 ? trainer.quarter_avg.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getScoreColor(trainer.ytd_avg)}`}>
                        {trainer.ytd_avg > 0 ? trainer.ytd_avg.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getScoreColor(trainer.all_time_avg)}`}>
                        {trainer.all_time_avg > 0 ? trainer.all_time_avg.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{trainer.total_assessments}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trainer.trend === 'up' ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs">+{trainer.trend_percentage}%</span>
                        </div>
                      ) : trainer.trend === 'down' ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-xs">{trainer.trend_percentage}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-primary-600 hover:text-primary-900 flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of{' '}
                  {filteredAndSorted.length} trainers
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TrainerPerformance
