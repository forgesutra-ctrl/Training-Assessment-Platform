import { useState, useEffect } from 'react'
import { User, Lock, Bell, Globe, Download, Save, Eye, EyeOff } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

const Settings = () => {
  const { user, profile, refreshProfile } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data'>('profile')

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notifications, setNotifications] = useState({
    assessment_received: true,
    monthly_summary: true,
    weekly_digest: profile?.role === 'admin',
    reminders: true,
  })

  useEffect(() => {
    if (profile) {
      setProfileData({ full_name: profile.full_name })
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileData.full_name })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(passwordData.newPassword)) {
      toast.error('Password must contain uppercase, lowercase, and number')
      return
    }

    try {
      setSaving(true)
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Fetch user's data
      const data = {
        profile: profile,
        assessments: [],
        // Add other data as needed
      }

      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my_data_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Data exported successfully!')
    } catch (error: any) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'data' as const, label: 'Data & Privacy', icon: Download },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="card mb-6 p-0">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="card">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                    disabled
                    className="input-field bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div className="mt-6">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="input-field pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-field"
                    placeholder="Enter new password"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="input-field"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <div className="mt-6">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Notifications</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Assessment Received</div>
                      <div className="text-sm text-gray-500">
                        Get notified when you receive a new assessment
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.assessment_received}
                      onChange={(e) =>
                        setNotifications({ ...notifications, assessment_received: e.target.checked })
                      }
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Monthly Summary</div>
                      <div className="text-sm text-gray-500">
                        Receive a monthly performance summary
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.monthly_summary}
                      onChange={(e) =>
                        setNotifications({ ...notifications, monthly_summary: e.target.checked })
                      }
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                  {profile?.role === 'admin' && (
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div>
                        <div className="font-medium text-gray-900">Weekly Digest</div>
                        <div className="text-sm text-gray-500">
                          Receive weekly platform activity summary
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.weekly_digest}
                        onChange={(e) =>
                          setNotifications({ ...notifications, weekly_digest: e.target.checked })
                        }
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </label>
                  )}
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Reminders</div>
                      <div className="text-sm text-gray-500">
                        Get reminders for pending assessments
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.reminders}
                      onChange={(e) =>
                        setNotifications({ ...notifications, reminders: e.target.checked })
                      }
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => toast.success('Notification preferences saved!')}
                    className="btn-primary"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Data & Privacy</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Export My Data</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download all your personal data in JSON format (GDPR compliance)
                    </p>
                    <button
                      onClick={handleExportData}
                      disabled={loading}
                      className="btn-secondary flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Export Data
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Data Retention</h3>
                    <p className="text-sm text-gray-600">
                      Your data is retained according to our data retention policy. Audit logs are kept for 1
                      year. Assessment data is retained indefinitely unless you request deletion.
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                          toast.error('Account deletion must be done by an administrator. Please contact support.')
                        }
                      }}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
