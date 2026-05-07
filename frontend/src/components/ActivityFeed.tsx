import React from 'react'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Activity {
  type: string
  title: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
}

interface ActivityFeedProps {
  activities: Activity[]
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {activities.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No activity yet</p>
      ) : (
        activities.map((activity, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getStatusColor(activity.status)}`}
          >
            <div className="flex items-start space-x-3">
              {getStatusIcon(activity.status)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default ActivityFeed
