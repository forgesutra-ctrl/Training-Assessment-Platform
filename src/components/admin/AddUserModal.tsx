import { useState, useEffect } from 'react'
import { X, User, Mail, Shield, Users, UserCheck, Lock, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CreateUserData } from '@/types'
import { createUser, getAvailableManagers, validateUserData } from '@/utils/userManagement'
import { useAuthContext } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddUserModal = ({ isOpen, onClose, onSuccess }: AddUserModalProps) => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [teams, setTeams] = useState<Array<{ id: string; team_name: string }>>([])
  const [availableManagers, setAvailableManagers] = useState<Array<{ id: string; full_name: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<CreateUserData>({
    full_name: '',
    email: '',
    role: 'trainer',
    team_id: null,
    reporting_manager_id: null,
    auto_generate_password: true,
    send_welcome_email: true,
  })

  useEffect(() => {
    if (isOpen) {
      loadTeams()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.team_id && formData.role === 'trainer') {
      loadManagers(formData.team_id)
    } else {
      setAvailableManagers([])
      setFormData((prev) => ({ ...prev, reporting_manager_id: null }))
    }
  }, [formData.team_id, formData.role])

  const loadTeams = async () => {
    try {
      setLoadingTeams(true)
      const { data, error } = await supabase.from('teams').select('id, team_name').order('team_name')
      if (error) throw error
      setTeams(data || [])
    } catch (error: any) {
      console.error('Error loading teams:', error)
      toast.error('Failed to load teams')
    } finally {
      setLoadingTeams(false)
    }
  }

  const loadManagers = async (teamId: string) => {
    try {
      setLoadingManagers(true)
      const managers = await getAvailableManagers(teamId)
      setAvailableManagers(managers)
    } catch (error: any) {
      console.error('Error loading managers:', error)
      toast.error('Failed to load managers')
    } finally {
      setLoadingManagers(false)
    }
  }

  const handleChange = (field: keyof CreateUserData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!user) {
      toast.error('You must be logged in to create users')
      return
    }

    try {
      setLoading(true)

      // Validate
      const validation = await validateUserData(formData)
      if (!validation.valid) {
        const errorMap: Record<string, string> = {}
        validation.errors.forEach((error) => {
          if (error.includes('email')) errorMap.email = error
          else if (error.includes('name')) errorMap.full_name = error
          else if (error.includes('team')) errorMap.team_id = error
          else if (error.includes('manager')) errorMap.reporting_manager_id = error
          else if (error.includes('password')) errorMap.password = error
          else errorMap.general = error
        })
        setErrors(errorMap)
        toast.error('Please fix validation errors')
        return
      }

      await createUser(formData, user.id)
      toast.success('User created successfully!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'trainer',
      team_id: null,
      reporting_manager_id: null,
      auto_generate_password: true,
      send_welcome_email: true,
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">Add New User</h2>
              <p className="text-sm text-primary-100 mt-1">Create a new user account</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className={`input-field ${errors.full_name ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="John Doe"
                required
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="john.doe@example.com"
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-2" />
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  handleChange('role', e.target.value)
                  if (e.target.value === 'admin') {
                    handleChange('team_id', null)
                    handleChange('reporting_manager_id', null)
                  }
                }}
                className="input-field"
                required
              >
                <option value="trainer">Trainer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Team */}
            {formData.role !== 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Team <span className="text-red-500">*</span>
                </label>
                {loadingTeams ? (
                  <div className="input-field flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-gray-500">Loading teams...</span>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.team_id || ''}
                      onChange={(e) => handleChange('team_id', e.target.value || null)}
                      className={`input-field ${errors.team_id ? 'border-red-300 focus:ring-red-500' : ''}`}
                      required
                    >
                      <option value="">-- Select Team --</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.team_name}
                        </option>
                      ))}
                    </select>
                    {errors.team_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.team_id}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Reporting Manager */}
            {formData.role === 'trainer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCheck className="w-4 h-4 inline mr-2" />
                  Reporting Manager <span className="text-red-500">*</span>
                </label>
                {loadingManagers ? (
                  <div className="input-field flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-gray-500">Loading managers...</span>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.reporting_manager_id || ''}
                      onChange={(e) => handleChange('reporting_manager_id', e.target.value || null)}
                      className={`input-field ${errors.reporting_manager_id ? 'border-red-300 focus:ring-red-500' : ''}`}
                      required
                      disabled={!formData.team_id}
                    >
                      <option value="">
                        {formData.team_id ? '-- Select Manager --' : 'Select team first'}
                      </option>
                      {availableManagers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name}
                        </option>
                      ))}
                    </select>
                    {errors.reporting_manager_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.reporting_manager_id}</p>
                    )}
                    {!formData.team_id && (
                      <p className="mt-1 text-sm text-gray-500">
                        Please select a team first to see available managers
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Password Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_generate"
                  checked={formData.auto_generate_password}
                  onChange={(e) => handleChange('auto_generate_password', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto_generate" className="ml-2 text-sm text-gray-700">
                  Auto-generate secure password
                </label>
              </div>

              {!formData.auto_generate_password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`input-field ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Enter password (min 8 chars, uppercase, lowercase, number)"
                    required={!formData.auto_generate_password}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must contain uppercase, lowercase, and number
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="send_email"
                  checked={formData.send_welcome_email}
                  onChange={(e) => handleChange('send_welcome_email', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="send_email" className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                  <Send className="w-4 h-4" />
                  Send welcome email with credentials
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddUserModal
