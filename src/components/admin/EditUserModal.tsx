import { useState, useEffect } from 'react'
import { X, User, Mail, Shield, Users, UserCheck, Lock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { UserForManagement, UpdateUserData } from '@/types'
import { updateUser, getAvailableManagers, resetUserPassword, setUserPassword, canAdminSetPassword, validateUserData } from '@/utils/userManagement'
import { useAuthContext } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

interface EditUserModalProps {
  isOpen: boolean
  user: UserForManagement | null
  onClose: () => void
  onSuccess: () => void
}

const EditUserModal = ({ isOpen, user, onClose, onSuccess }: EditUserModalProps) => {
  const { user: currentUser } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [settingPassword, setSettingPassword] = useState(false)
  const [newPasswordField, setNewPasswordField] = useState('')
  const [teams, setTeams] = useState<Array<{ id: string; team_name: string }>>([])
  const [availableManagers, setAvailableManagers] = useState<Array<{ id: string; full_name: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showRoleChangeWarning, setShowRoleChangeWarning] = useState(false)
  const [originalRole, setOriginalRole] = useState<string>('')

  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: '',
    role: 'trainer',
    team_id: null,
    reporting_manager_id: null,
    status: 'active',
  })

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        full_name: user.full_name,
        role: user.role,
        team_id: user.team_id,
        reporting_manager_id: user.reporting_manager_id,
        status: user.status,
      })
      setOriginalRole(user.role)
      loadTeams()
      if (user.team_id && user.role === 'trainer') {
        loadManagers(user.team_id)
      }
    }
  }, [isOpen, user])

  useEffect(() => {
    if (formData.team_id && formData.role === 'trainer') {
      loadManagers(formData.team_id)
    } else {
      setAvailableManagers([])
      if (formData.role !== 'trainer') {
        setFormData((prev) => ({ ...prev, reporting_manager_id: null }))
      }
    }
  }, [formData.team_id, formData.role])

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase.from('teams').select('id, team_name').order('team_name')
      if (error) throw error
      setTeams(data || [])
    } catch (error: any) {
      console.error('Error loading teams:', error)
      toast.error('Failed to load teams')
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

  const handleChange = (field: keyof UpdateUserData, value: any) => {
    // Check for role change
    if (field === 'role' && value !== originalRole && (value === 'manager' || originalRole === 'manager')) {
      setShowRoleChangeWarning(true)
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
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

    if (!user || !currentUser) {
      toast.error('User data is missing')
      return
    }

    // Check if user is trying to edit themselves
    if (user.id === currentUser.id) {
      if (formData.role !== user.role) {
        toast.error('You cannot change your own role')
        return
      }
    }

    try {
      setLoading(true)

      // Validate
      const validation = await validateUserData(formData, true, user.id)
      if (!validation.valid) {
        const errorMap: Record<string, string> = {}
        validation.errors.forEach((error) => {
          if (error.includes('name')) errorMap.full_name = error
          else if (error.includes('team')) errorMap.team_id = error
          else if (error.includes('manager')) errorMap.reporting_manager_id = error
          else errorMap.general = error
        })
        setErrors(errorMap)
        toast.error('Please fix validation errors')
        return
      }

      await updateUser(user.id, formData, currentUser.id)
      toast.success('User updated successfully!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user) return
    if (!canAdminSetPassword()) {
      toast.error('Admin password reset is not configured. Add VITE_SUPABASE_SERVICE_ROLE_KEY to .env (see SERVICE_ROLE_KEY_SETUP.md).')
      return
    }
    if (!confirm('Generate a new random password for this user? The new password will be shown so you can share it with them.')) {
      return
    }
    try {
      setResettingPassword(true)
      const newPassword = await resetUserPassword(user.id)
      toast.success('Password regenerated. New password: ' + newPassword)
    } catch (error: any) {
      console.error('Error resetting password:', error)
      toast.error(error?.message || 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleSetPassword = async () => {
    if (!user || !newPasswordField.trim()) {
      toast.error('Enter a new password')
      return
    }
    if (!canAdminSetPassword()) {
      toast.error('Admin password set is not configured. Add VITE_SUPABASE_SERVICE_ROLE_KEY to .env (see SERVICE_ROLE_KEY_SETUP.md).')
      return
    }
    try {
      setSettingPassword(true)
      await setUserPassword(user.id, newPasswordField.trim())
      toast.success('Password updated. Share the new password with the user.')
      setNewPasswordField('')
    } catch (error: any) {
      console.error('Error setting password:', error)
      toast.error(error?.message || 'Failed to set password')
    } finally {
      setSettingPassword(false)
    }
  }

  const handleClose = () => {
    setFormData({
      full_name: '',
      role: 'trainer',
      team_id: null,
      reporting_manager_id: null,
      status: 'active',
    })
    setErrors({})
    setShowRoleChangeWarning(false)
    setOriginalRole('')
    setNewPasswordField('')
    onClose()
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">Edit User</h2>
              <p className="text-sm text-primary-100 mt-1">Update user information</p>
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
            {showRoleChangeWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Role Change Warning</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changing the role will affect reporting relationships and assessment permissions. Are you sure you want to continue?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRoleChangeWarning(false)}
                      className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleChangeWarning(false)
                        setOriginalRole(formData.role as string)
                      }}
                      className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input-field bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

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
                required
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-2" />
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="input-field"
                required
                disabled={user.id === currentUser?.id}
              >
                <option value="trainer">Trainer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              {user.id === currentUser?.id && (
                <p className="mt-1 text-xs text-gray-500">You cannot change your own role</p>
              )}
            </div>

            {/* Team */}
            {formData.role !== 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Team <span className="text-red-500">*</span>
                </label>
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
                  </>
                )}
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Password Management */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password Management
              </label>
              {!canAdminSetPassword() ? (
                <p className="text-sm text-amber-600">
                  To set or reset passwords, add VITE_SUPABASE_SERVICE_ROLE_KEY to .env (see SERVICE_ROLE_KEY_SETUP.md).
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Set new / temporary password</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newPasswordField}
                        onChange={(e) => setNewPasswordField(e.target.value)}
                        placeholder="Min 8 chars, upper, lower, number"
                        className="input-field flex-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleSetPassword}
                        disabled={settingPassword || !newPasswordField.trim()}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
                      >
                        {settingPassword ? 'Setting...' : 'Set password'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resettingPassword}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                    >
                      {resettingPassword ? 'Regenerating...' : 'Regenerate password'}
                    </button>
                    <span className="text-xs text-gray-500">Generates a random password and shows it (share with user)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Read-only fields */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{new Date(user.updated_at).toLocaleDateString()}</span>
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
                disabled={loading || showRoleChangeWarning}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Update User
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

export default EditUserModal
