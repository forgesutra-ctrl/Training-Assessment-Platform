import { AlertCircle, Clock, User, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Recommendation } from '@/utils/recommendations'

interface ActionRequiredWidgetProps {
  recommendations: Recommendation[]
  userRole: string
}

const ActionRequiredWidget = ({ recommendations, userRole }: ActionRequiredWidgetProps) => {
  const navigate = useNavigate()
  const actionItems = recommendations.filter((r) => r.type === 'action' || r.type === 'alert')

  if (actionItems.length === 0) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">All caught up!</h3>
            <p className="text-sm text-gray-600">No actions required at this time.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Action Required</h3>
        </div>
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          {actionItems.length}
        </span>
      </div>

      <div className="space-y-3">
        {actionItems.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {item.type === 'alert' && <Clock className="w-4 h-4 text-orange-600" />}
                  {item.type === 'action' && <User className="w-4 h-4 text-blue-600" />}
                  <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              {item.actionUrl && (
                <button
                  onClick={() => navigate(item.actionUrl!)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  {item.actionLabel || 'View'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActionRequiredWidget
