import { useState, useEffect } from 'react'
import { Target, Plus, CheckCircle, XCircle, TrendingUp, Calendar } from 'lucide-react'
import { fetchUserGoals, createGoal, updateGoal } from '@/utils/gamification'
import { Goal } from '@/types'
import { useAuthContext } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const GoalTracking = () => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null)
  const [newGoal, setNewGoal] = useState({
    type: 'overall_rating' as 'overall_rating' | 'parameter' | 'assessment_count',
    target_value: '',
    target_parameter: '',
    deadline: '',
    description: '',
  })

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  const loadGoals = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const previousGoals = goals
      const data = await fetchUserGoals(user.id).catch((error: any) => {
        // If table doesn't exist or RLS blocks access, return empty array
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('permission')) {
          console.warn('Goals table not accessible:', error.message)
          return []
        }
        throw error
      })
      
      // Check for newly completed goals
      if (previousGoals.length > 0 && data.length > 0) {
        const newlyCompleted = data.find(
          (g) => g.status === 'completed' && 
          !previousGoals.find((pg) => pg.id === g.id && pg.status === 'completed')
        )
        if (newlyCompleted) {
          setCompletedGoal(newlyCompleted)
          toast.success(`Goal achieved: ${newlyCompleted.description || 'Congratulations!'}`)
        }
      }
      
      setGoals(data || [])
    } catch (error: any) {
      console.error('Error loading goals:', error)
      // Don't show error toast if gamification is disabled or tables don't exist
      if (error.code !== 'PGRST116' && error.code !== '42P01' && !error.message?.includes('relation') && !error.message?.includes('permission')) {
        toast.error('Failed to load goals')
      }
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!user) return

    try {
      await createGoal({
        user_id: user.id,
        type: newGoal.type,
        target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : null,
        target_parameter: newGoal.target_parameter || null,
        deadline: newGoal.deadline || null,
        status: 'active',
        created_by: user.id,
        description: newGoal.description || null,
      })

      toast.success('Goal created successfully!')
      setShowCreateModal(false)
      setNewGoal({
        type: 'overall_rating',
        target_value: '',
        target_parameter: '',
        deadline: '',
        description: '',
      })
      loadGoals()
    } catch (error: any) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create goal')
    }
  }

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'overall_rating':
        return 'Overall Rating'
      case 'parameter':
        return 'Parameter'
      case 'assessment_count':
        return 'Assessment Count'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading goals..." />
      </div>
    )
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goals & Progress</h2>
          <p className="text-sm text-gray-600 mt-1">
            Set goals and track your progress toward improvement
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            Active Goals ({activeGoals.length})
          </h3>
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {goal.description || getGoalTypeLabel(goal.type)}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span>Type:</span>
                        <span className="font-medium">{getGoalTypeLabel(goal.type)}</span>
                      </div>
                      {goal.target_value && (
                        <div className="flex items-center gap-2">
                          <span>Target:</span>
                          <span className="font-medium">{goal.target_value}</span>
                        </div>
                      )}
                      {goal.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">
                      {goal.progress ? `${Math.round(goal.progress)}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Completed Goals ({completedGoals.length})
          </h3>
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {goal.description || getGoalTypeLabel(goal.type)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Completed on {goal.completed_at ? new Date(goal.completed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="card text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No goals set yet</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
                  <select
                    value={newGoal.type}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, type: e.target.value as any })
                    }
                    className="input-field"
                  >
                    <option value="overall_rating">Overall Rating</option>
                    <option value="parameter">Parameter-Specific</option>
                    <option value="assessment_count">Assessment Count</option>
                  </select>
                </div>
                {newGoal.type === 'parameter' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parameter
                    </label>
                    <select
                      value={newGoal.target_parameter}
                      onChange={(e) => setNewGoal({ ...newGoal, target_parameter: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Parameter</option>
                      <option value="trainers_readiness">Trainer's Readiness</option>
                      <option value="communication_skills">Communication Skills</option>
                      <option value="domain_expertise">Domain Expertise</option>
                      <option value="knowledge_displayed">Knowledge Displayed</option>
                      <option value="people_management">People Management</option>
                      <option value="technical_skills">Technical Skills</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                    className="input-field"
                    placeholder={newGoal.type === 'overall_rating' ? 'e.g., 4.5' : 'e.g., 5'}
                    step="0.1"
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="e.g., Improve Technical Skills to 4+ by end of Q2"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button onClick={handleCreateGoal} className="btn-primary flex-1">
                    Create Goal
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

export default GoalTracking
