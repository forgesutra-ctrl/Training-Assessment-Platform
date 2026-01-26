import { useState, useEffect, useMemo } from 'react'
import {
  UserPlus,
  Upload,
  Download,
  Search,
  Users,
  Shield,
  UserCheck,
  Eye,
  Edit,
  Power,
  PowerOff,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react'
import { UserForManagement, UserStats } from '@/types'
import {
  fetchAllUsers,
  fetchUserStats,
  activateUser,
  deactivateUser,
  downloadCSVTemplate,
} from '@/utils/userManagement'
import { supabase } from '@/lib/supabase'
import AddUserModal from './AddUserModal'
import EditUserModal from './EditUserModal'
import BulkUploadModal from './BulkUploadModal'
import UserDetailModal from './UserDetailModal'
import ReportingStructure from './ReportingStructure'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

type SortField = keyof UserForManagement
type SortDirection = 'asc' | 'desc'

const UserManagement = () => {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserForManagement[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalManagers: 0,
    totalTrainers: 0,
    totalAdmins: 0,
    activeUsersThisMonth: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [teams, setTeams] = useState<Array<{ id: string; team_name: string }>>([])

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showOrgStructure, setShowOrgStructure] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserForManagement | null>(null)

  const itemsPerPage = 20

  useEffect(() => {
    loadData()
  }, [roleFilter, teamFilter, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, statsData, teamsData] = await Promise.all([
        fetchAllUsers({
          role: roleFilter,
          team_id: teamFilter,
          status: statusFilter,
          search: searchTerm,
        }),
        fetchUserStats(),
        supabase.from('teams').select('id, team_name').order('team_name'),
      ])

      setUsers(usersData)
      setStats(statsData)
      setTeams(teamsData.data || [])
    } catch (error: any) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort users
  const filteredAndSorted = useMemo(() => {
    let filtered = users

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return filtered
  }, [users, searchTerm, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedUsers = filteredAndSorted.slice(
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

  const handleToggleUserStatus = async (user: UserForManagement) => {
    try {
      if (user.status === 'active') {
        await deactivateUser(user.id)
        toast.success(`${user.full_name} has been deactivated`)
      } else {
        await activateUser(user.id)
        toast.success(`${user.full_name} has been activated`)
      }
      loadData()
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleEdit = (user: UserForManagement) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleViewDetails = (user: UserForManagement) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((u) => u.id)))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'manager':
        return 'bg-green-100 text-green-800'
      case 'trainer':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  if (showOrgStructure) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Organizational Structure</h2>
          <button
            onClick={() => setShowOrgStructure(false)}
            className="btn-secondary"
          >
            Back to User List
          </button>
        </div>
        <ReportingStructure onUserClick={(userId) => {
          const user = users.find((u) => u.id === userId)
          if (user) {
            handleEdit(user)
          }
        }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Managers</div>
          <div className="text-2xl font-bold text-green-600">{stats.totalManagers}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Trainers</div>
          <div className="text-2xl font-bold text-purple-600">{stats.totalTrainers}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Admins</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalAdmins}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Active This Month</div>
          <div className="text-2xl font-bold text-primary-600">{stats.activeUsersThisMonth}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New User
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Bulk Upload
            </button>
            <button
              onClick={() => setShowOrgStructure(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Org Structure
            </button>
            <button
              onClick={downloadCSVTemplate}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Template
            </button>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search by name or email..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="trainer">Trainer</option>
            </select>
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
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading users..." />
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your filters</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Users ({filteredAndSorted.length})
              </h3>
              {selectedUsers.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedUsers.size} selected</span>
                  <button className="text-sm text-red-600 hover:text-red-800">
                    Bulk Deactivate
                  </button>
                </div>
              )}
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button onClick={handleSelectAll} className="p-1 hover:bg-gray-200 rounded">
                      {selectedUsers.size === paginatedUsers.length ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      Role
                      <SortIcon field="role" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('team_name')}
                  >
                    <div className="flex items-center gap-2">
                      Team
                      <SortIcon field="team_name" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reporting Manager
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectUser(user.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {selectedUsers.has(user.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.team_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {user.reporting_manager_name || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`p-1 ${
                            user.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
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
                  {filteredAndSorted.length} users
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

      {/* Modals */}
      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={loadData}
        />
      )}

      {showBulkModal && (
        <BulkUploadModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={loadData}
        />
      )}

      {showDetailModal && selectedUser && (
        <UserDetailModal
          isOpen={showDetailModal}
          user={selectedUser}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}

export default UserManagement
