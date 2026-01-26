import { useState, useEffect } from 'react'
import { X, User, Mail, Shield, Users, UserCheck, Download, MessageSquare, Calendar, Star } from 'lucide-react'
import { UserForManagement } from '@/types'
import { fetchTrainerAssessments } from '@/utils/trainerAssessments'
import { fetchManagerAssessments } from '@/utils/assessments'
import { TrainerAssessmentWithDetails, AssessmentWithDetails } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface UserDetailModalProps {
  isOpen: boolean
  user: UserForManagement | null
  onClose: () => void
}

const UserDetailModal = ({ isOpen, user, onClose }: UserDetailModalProps) => {
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState<
    (TrainerAssessmentWithDetails | AssessmentWithDetails)[]
  >([])
  const [stats, setStats] = useState({
    totalAssessments: 0,
    averageRating: 0,
    trend: 'stable' as 'up' | 'down' | 'stable',
  })

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        setLoading(true)
        if (user.role === 'trainer') {
          const data = await fetchTrainerAssessments(user.id)
          setAssessments(data.slice(0, 10))

          if (data.length > 0) {
            const avg = data.reduce((sum, a) => sum + a.average_score, 0) / data.length
            setStats({
              totalAssessments: data.length,
              averageRating: Number(avg.toFixed(2)),
              trend: 'stable',
            })
          }
        } else if (user.role === 'manager') {
          const data = await fetchManagerAssessments(user.id, 10)
          setAssessments(data)

          if (data.length > 0) {
            const avg = data.reduce((sum, a) => sum + a.average_score, 0) / data.length
            setStats({
              totalAssessments: data.length,
              averageRating: Number(avg.toFixed(2)),
              trend: 'stable',
            })
          }
        }
      } catch (error: any) {
        console.error('Error loading user details:', error)
        toast.error('Failed to load user activity')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">User Details</h2>
              <p className="text-sm text-primary-100 mt-1">View user information and activity</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* User Info Card */}
            <div className="card bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{user.full_name}</h3>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.team_name && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{user.team_name}</span>
                      </div>
                    )}
                    {user.reporting_manager_name && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <UserCheck className="w-4 h-4" />
                        <span>Reports to: {user.reporting_manager_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-medium ${
                        user.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{formatDate(user.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Statistics */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" text="Loading activity data..." />
              </div>
            ) : (
              <>
                {user.role === 'trainer' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card">
                      <div className="text-sm text-gray-600 mb-1">Assessments Received</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalAssessments}</div>
                    </div>
                    <div className="card">
                      <div className="text-sm text-gray-600 mb-1">Average Rating</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {stats.averageRating > 0 ? stats.averageRating.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div className="card">
                      <div className="text-sm text-gray-600 mb-1">Trend</div>
                      <div className="text-2xl font-bold text-gray-900 capitalize">{stats.trend}</div>
                    </div>
                  </div>
                )}

                {user.role === 'manager' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card">
                      <div className="text-sm text-gray-600 mb-1">Assessments Submitted</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalAssessments}</div>
                    </div>
                    <div className="card">
                      <div className="text-sm text-gray-600 mb-1">Average Rating Given</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {stats.averageRating > 0 ? stats.averageRating.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div className="card">
                      <div className="text-sm text-gray-600 mb-1">Status</div>
                      <div className="text-2xl font-bold text-gray-900 capitalize">{user.status}</div>
                    </div>
                  </div>
                )}

                {/* Assessment History */}
                {assessments.length > 0 && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.role === 'trainer' ? 'Recent Assessments Received' : 'Recent Assessments Submitted'}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            {user.role === 'trainer' ? (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Assessed By
                              </th>
                            ) : (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trainer
                              </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assessments.map((assessment) => (
                            <tr key={assessment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(assessment.assessment_date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {user.role === 'trainer'
                                  ? (assessment as TrainerAssessmentWithDetails).assessor_name
                                  : (assessment as AssessmentWithDetails).trainer_name}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-primary-600">
                                    {assessment.average_score.toFixed(2)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= Math.round(assessment.average_score)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'fill-gray-200 text-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button className="btn-secondary flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Report
              </button>
              <button className="btn-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
