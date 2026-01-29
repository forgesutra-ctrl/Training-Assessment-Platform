import { useState, useEffect, useMemo } from 'react'
import { Search, TrendingUp, TrendingDown, Eye, Download, ChevronUp, ChevronDown, X, Pencil } from 'lucide-react'
import { fetchAllTrainersWithStats } from '@/utils/adminQueries'
import { TrainerWithStats, ASSESSMENT_STRUCTURE } from '@/types'
import { fetchTrainerAssessments } from '@/utils/trainerAssessments'
import { exportToExcel, exportToCSV } from '@/utils/reporting'
import { calculateCategoryAverages } from '@/utils/trainerStats'
import LoadingSpinner from '@/components/LoadingSpinner'
import AdminEditAssessmentModal from '@/components/admin/AdminEditAssessmentModal'
import toast from 'react-hot-toast'
import { TrainerAssessmentWithDetails } from '@/types'

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
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithStats | null>(null)
  const [trainerAssessments, setTrainerAssessments] = useState<TrainerAssessmentWithDetails[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [showTrainerModal, setShowTrainerModal] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<TrainerAssessmentWithDetails | null>(null)
  const itemsPerPage = 20

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAllTrainersWithStats(dateRange)
        setTrainers(data || [])
      } catch (error: any) {
        console.error('Error loading trainer data:', error)
        const errorMessage = error?.message || 'Failed to load trainer performance data'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange]) // Refetches when dateRange changes or component remounts

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

  const handleViewTrainer = async (trainer: TrainerWithStats) => {
    try {
      setSelectedTrainer(trainer)
      setLoadingAssessments(true)
      setShowTrainerModal(true)
      
      const assessments = await fetchTrainerAssessments(trainer.id)
      setTrainerAssessments(assessments)
    } catch (error: any) {
      console.error('Error loading trainer assessments:', error)
      toast.error('Failed to load trainer details')
    } finally {
      setLoadingAssessments(false)
    }
  }

  const handleExportTrainer = async (trainer: TrainerWithStats) => {
    try {
      toast.loading('Exporting trainer data...', { id: 'export' })
      
      // Fetch trainer assessments
      const assessments = await fetchTrainerAssessments(trainer.id)
      
      // Format data for export with all 21 parameters grouped by category
      const exportData = assessments.map((assessment) => {
        const data: Record<string, any> = {
          'Assessment Date': new Date(assessment.assessment_date).toLocaleDateString(),
          'Assessor': assessment.assessor_name,
          'Average Score': assessment.average_score,
          'Overall Comments': assessment.overall_comments || '',
        }

        // Add all 21 parameters organized by category
        ASSESSMENT_STRUCTURE.categories.forEach((category) => {
          category.parameters.forEach((param) => {
            const rating = (assessment as any)[param.id] as number | null
            const comments = (assessment as any)[`${param.id}_comments`] as string | null
            data[`${category.name} - ${param.label}`] = rating || 'N/A'
            data[`${category.name} - ${param.label} Comments`] = comments || ''
          })
        })

        return data
      })

      // Export to Excel
      await exportToExcel(
        {
          [`${trainer.full_name} - Performance`]: exportData,
          'Summary': [{
            'Trainer Name': trainer.full_name,
            'Team': trainer.team_name || 'N/A',
            'Month Avg': trainer.current_month_avg.toFixed(2),
            'Quarter Avg': trainer.quarter_avg.toFixed(2),
            'YTD Avg': trainer.ytd_avg.toFixed(2),
            'All-Time Avg': trainer.all_time_avg.toFixed(2),
            'Total Assessments': trainer.total_assessments,
          }]
        },
        `${trainer.full_name.replace(/\s+/g, '_')}_Performance_${new Date().toISOString().split('T')[0]}`
      )

      toast.success('Trainer data exported successfully', { id: 'export' })
    } catch (error: any) {
      console.error('Error exporting trainer data:', error)
      toast.error('Failed to export trainer data', { id: 'export' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading trainer performance data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-600 mb-4">
          <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
            const loadData = async () => {
              try {
                const data = await fetchAllTrainersWithStats(dateRange)
                setTrainers(data || [])
                setError(null)
              } catch (err: any) {
                setError(err?.message || 'Failed to load data')
              } finally {
                setLoading(false)
              }
            }
            loadData()
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
                <option key={team} value={team || ''}>
                  {team || 'All Teams'}
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
                        <button
                          onClick={() => handleViewTrainer(trainer)}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleExportTrainer(trainer)}
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
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

      {/* Trainer Details Modal */}
      {showTrainerModal && selectedTrainer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowTrainerModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedTrainer.full_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedTrainer.team_name || 'No team assigned'}</p>
                  </div>
                  <button
                    onClick={() => setShowTrainerModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Trainer Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Month Avg</div>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedTrainer.current_month_avg)}`}>
                      {selectedTrainer.current_month_avg > 0 ? selectedTrainer.current_month_avg.toFixed(2) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Quarter Avg</div>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedTrainer.quarter_avg)}`}>
                      {selectedTrainer.quarter_avg > 0 ? selectedTrainer.quarter_avg.toFixed(2) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">YTD Avg</div>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedTrainer.ytd_avg)}`}>
                      {selectedTrainer.ytd_avg > 0 ? selectedTrainer.ytd_avg.toFixed(2) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Total Assessments</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedTrainer.total_assessments}</div>
                  </div>
                </div>

                {/* Assessments List */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Assessment History</h4>
                  {loadingAssessments ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="md" text="Loading assessments..." />
                    </div>
                  ) : trainerAssessments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No assessments found for this trainer</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {trainerAssessments.map((assessment) => (
                        <div
                          key={assessment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900">
                                Assessed by: {assessment.assessor_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(assessment.assessment_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`text-xl font-bold ${getScoreColor(assessment.average_score)}`}>
                                {assessment.average_score.toFixed(2)}
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingAssessment(assessment)}
                                className="p-2 rounded-lg hover:bg-primary-100 text-primary-600"
                                title="Edit assessment (admin)"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {/* Category Averages */}
                          <div className="mb-3">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Category Averages:</div>
                            <div className="grid grid-cols-5 gap-2 text-xs">
                              {calculateCategoryAverages(assessment).map((catAvg) => {
                                const category = ASSESSMENT_STRUCTURE.categories.find((c) => c.id === catAvg.categoryId)
                                return (
                                  <div key={catAvg.categoryId} className="text-center">
                                    <div className="text-lg">{category?.icon}</div>
                                    <div className="font-medium">{catAvg.average.toFixed(1)}</div>
                                    <div className="text-gray-500 truncate" title={catAvg.categoryName}>
                                      {catAvg.categoryName.split(' ')[0]}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          
                          {/* All Parameters (Collapsible) */}
                          <details className="text-xs">
                            <summary className="cursor-pointer text-primary-600 hover:text-primary-800 font-medium mb-2">
                              View All 21 Parameters
                            </summary>
                            <div className="mt-2 space-y-3 pl-4 border-l-2 border-gray-200">
                              {ASSESSMENT_STRUCTURE.categories.map((category) => {
                                const categoryParams = category.parameters.filter((param) => {
                                  const rating = (assessment as any)[param.id] as number | null
                                  return rating && rating > 0
                                })
                                
                                if (categoryParams.length === 0) return null
                                
                                return (
                                  <div key={category.id} className="space-y-1">
                                    <div className="font-semibold text-gray-700 flex items-center gap-1">
                                      <span>{category.icon}</span>
                                      <span>{category.name}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 ml-4">
                                      {categoryParams.map((param) => {
                                        const rating = (assessment as any)[param.id] as number | null
                                        const comments = (assessment as any)[`${param.id}_comments`] as string | null
                                        return (
                                          <div key={param.id} className="flex items-center justify-between">
                                            <span className="text-gray-600">{param.label}:</span>
                                            <span className="font-medium">{rating}/5</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </details>
                          {assessment.overall_comments && (
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                              {assessment.overall_comments}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Edit Assessment Modal */}
                {editingAssessment && (
                  <AdminEditAssessmentModal
                    assessment={editingAssessment}
                    onSave={async () => {
                      if (selectedTrainer) {
                        const assessments = await fetchTrainerAssessments(selectedTrainer.id)
                        setTrainerAssessments(assessments)
                      }
                    }}
                    onClose={() => setEditingAssessment(null)}
                  />
                )}

                {/* Modal Footer */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleExportTrainer(selectedTrainer)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </button>
                  <button
                    onClick={() => setShowTrainerModal(false)}
                    className="btn-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainerPerformance
