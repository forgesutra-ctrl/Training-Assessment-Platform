import { useState, useEffect } from 'react'
import { Download, Calendar, Filter, Search, Clock, User, Activity, Target } from 'lucide-react'
import { fetchAuditLogs, downloadAuditLogsCSV, type AuditLog as AuditLogType, AuditActionType, AuditTargetType } from '@/utils/auditLog'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const AuditLog = () => {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLogType[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<{
    startDate: string
    endDate: string
    actionType: AuditActionType | undefined
    userId: string
    targetType: AuditTargetType | undefined
  }>({
    startDate: '',
    endDate: '',
    actionType: undefined,
    userId: '',
    targetType: undefined,
  })
  const itemsPerPage = 50

  useEffect(() => {
    loadLogs()
  }, [currentPage, filters])

  const [error, setError] = useState<string | null>(null)

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const offset = (currentPage - 1) * itemsPerPage
      const result = await fetchAuditLogs({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        actionType: filters.actionType,
        userId: filters.userId || undefined,
        targetType: filters.targetType,
      }, itemsPerPage, offset)
      setLogs(result.logs || [])
      setTotal(result.total || 0)
    } catch (error: any) {
      console.error('Error loading audit logs:', error)
      const errorMessage = error?.message || 'Failed to load audit logs'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Fetch all logs for export
    fetchAuditLogs({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      actionType: filters.actionType,
      userId: filters.userId || undefined,
      targetType: filters.targetType,
    }, 10000, 0)
      .then((result) => {
        downloadAuditLogsCSV(result.logs)
        toast.success('Audit log exported successfully')
      })
      .catch((error) => {
        console.error('Error exporting audit logs:', error)
        toast.error('Failed to export audit logs')
      })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionColor = (actionType: string) => {
    if (actionType.includes('created') || actionType.includes('success')) {
      return 'bg-green-100 text-green-800'
    }
    if (actionType.includes('deleted') || actionType.includes('failed')) {
      return 'bg-red-100 text-red-800'
    }
    if (actionType.includes('updated') || actionType.includes('changed')) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const actionTypes: AuditActionType[] = [
    'assessment_submitted',
    'assessment_updated',
    'assessment_deleted',
    'user_created',
    'user_updated',
    'user_deleted',
    'user_role_changed',
    'user_activated',
    'user_deactivated',
    'password_reset',
    'login_success',
    'login_failed',
    'export_data',
    'bulk_upload',
    'settings_changed',
  ]

  const targetTypes: AuditTargetType[] = ['assessment', 'user', 'export', 'login', 'settings']

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-600 mt-1">Track all system activities and changes</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value })
                setCurrentPage(1)
              }}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value })
                setCurrentPage(1)
              }}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Activity className="w-4 h-4 inline mr-2" />
              Action Type
            </label>
            <select
              value={filters.actionType}
              onChange={(e) => {
                setFilters({ ...filters, actionType: e.target.value ? (e.target.value as AuditActionType) : undefined })
                setCurrentPage(1)
              }}
              className="input-field"
            >
              <option value="">All Actions</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Target Type
            </label>
            <select
              value={filters.targetType || ''}
              onChange={(e) => {
                setFilters({ ...filters, targetType: e.target.value ? (e.target.value as AuditTargetType) : undefined })
                setCurrentPage(1)
              }}
              className="input-field"
            >
              <option value="">All Types</option>
              {targetTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  startDate: '',
                  endDate: '',
                  actionType: undefined,
                  userId: '',
                  targetType: undefined,
                })
                setCurrentPage(1)
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Logs</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Showing</div>
          <div className="text-2xl font-bold text-gray-900">
            {logs.length} of {total}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Retention</div>
          <div className="text-2xl font-bold text-gray-900">1 Year</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading audit logs..." />
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <div className="text-red-600 mb-4">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Audit Logs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                loadLogs()
              }}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found matching your filters</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}
                      >
                        {log.action_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.target_type ? (
                        <span className="capitalize">{log.target_type}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      {log.target_id && (
                        <span className="text-xs text-gray-400 ml-2">({log.target_id.slice(0, 8)}...)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-primary-600 hover:text-primary-800">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.ip_address || <span className="text-gray-400">—</span>}
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
                  {Math.min(currentPage * itemsPerPage, total)} of {total} logs
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

export default AuditLog
